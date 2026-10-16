---
title: "Miles de productos simples que en realidad eran variantes: el plan para llevarlos a Shopify"
description: "Una tienda en WooCommerce quería pasarse a Shopify, pero tenía cada peso de cada producto cargado como un producto distinto. Antes de migrar había que reagruparlos, y el primer paso fue pedir definiciones, no escribir código."
date: 2026-10-03
category: Dev
tags: [WooCommerce, Shopify, CSV, Python]
featured: false
---

En el trabajo, un cliente con una tienda en WooCommerce quería pasarse a Shopify: un sitio más ordenado, con menos ruido, que ayudara a vender más. El problema estaba en el catálogo. Un mismo alimento, en bolsas de 3 y de 7,5 kilos, no era un producto con dos opciones: eran **dos productos distintos**, cada uno con su ficha. Así con todo el catálogo, que podía llegar a unos 4.000 productos.

Migrar eso tal cual habría llevado el desorden a la tienda nueva. Había que reagrupar antes de mover.

## Simples contra variables

WooCommerce distingue entre productos **simples** (una sola versión) y **variables** (un producto con opciones, como talla, color o peso, cada una con su precio, su SKU y su stock). Esta tienda tenía todo como simple. No sé por qué se armó así, pero tenía un costo: el cliente ve varias fichas casi iguales en vez de una con botones, y el inventario se administra por separado.

En Shopify el equivalente a un producto variable es un producto con **variantes**. El objetivo era llegar a eso.

## Cómo ve Shopify las variantes en un CSV

El importador de Shopify usa un CSV donde **cada fila es una variante**, y las variantes de un mismo producto comparten el mismo `Handle`, que es el identificador del producto en la URL. La primera fila lleva el título y el nombre de la opción; las siguientes, solo el valor de la opción y los datos de esa variante:

```text title="csv de Shopify · un producto con tres variantes de peso (columnas resumidas)"
Handle,Title,Option1 Name,Option1 Value,Variant SKU,Variant Price
alimento-gato-adulto,Alimento Gato Adulto,Peso,3 kg,AGA-3,21990
alimento-gato-adulto,,,7.5 kg,AGA-75,45990
alimento-gato-adulto,,,15 kg,AGA-15,79990
```

Un producto sin opciones va en una sola fila, con `Title` como nombre de opción y `Default Title` como valor. Es la convención de Shopify.

## La muestra y el plan

El cliente nos mandó una planilla de muestra con 53 productos, con la misma estructura que tendría el archivo completo. Con eso armamos un plan por etapas:

1. **Limpiar y agrupar la muestra.** Sacar el peso del nombre, normalizarlo (en el archivo venía pegado al número, como `2kg`) y agrupar por el nombre que queda.
2. **Probar el resultado** importándolo en una tienda Shopify de prueba, para ver las fichas como las vería un cliente.
3. **Escalar al catálogo completo** con el mismo proceso.
4. **Migrar**, preparando el archivo nosotros o con una herramienta especializada como Matrixify, que importa catálogos grandes a Shopify y permite reintentar lo que falle.

Hubo que decidir algo antes de la primera línea de código: **solo los productos con peso se agrupan**. La tienda vende alimento, pero también accesorios, y un rascador no tiene "variantes de peso".

## El primer paso, en código

Este script hace la etapa 1: lee el CSV que exporta WooCommerce, separa el peso del nombre, agrupa los que comparten el resto del nombre y escribe el CSV para Shopify. Lo que no se agrupa pasa como producto sin opciones, con su nombre original.

```python title="python · agrupar.py (uso: python3 agrupar.py export-woocommerce.csv productos-shopify.csv)"
"""Agrupa productos simples de WooCommerce que son el mismo producto en distintos pesos
y escribe un CSV de productos de Shopify, con una fila por variante."""
import csv, re, sys, unicodedata
from collections import defaultdict

# Nombres de columna del export de WooCommerce (en un sitio en español vienen traducidos)
NOMBRE, SKU, PRECIO, STOCK, IMAGEN = 'Nombre', 'SKU', 'Precio normal', 'Inventario', 'Imágenes'
PESO = re.compile(r'\s*(\d+(?:[.,]\d+)?)\s*(kg|kgs|g|gr|grs)\b\.?', re.I)

def handle(texto):
    t = unicodedata.normalize('NFD', texto.lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def separar(nombre):
    """'Alimento Adulto 7,5kg' -> ('Alimento Adulto', '7.5 kg'); sin peso -> (nombre, None)"""
    m = PESO.search(nombre)
    if not m:
        return nombre.strip(), None
    unidad = 'kg' if m.group(2).lower().startswith('kg') else 'g'
    base = re.sub(r'\s{2,}', ' ', PESO.sub(' ', nombre, count=1)).strip(' -')
    return base, f"{m.group(1).replace(',', '.')} {unidad}"

grupos = defaultdict(list)
with open(sys.argv[1], newline='', encoding='utf-8-sig') as f:
    for fila in csv.DictReader(f):
        base, peso = separar(fila[NOMBRE])
        grupos[base].append((peso, fila))

clave = lambda p: float(p[0].split()[0]) * (1000 if p[0].endswith('kg') else 1) if p[0] else 0
with open(sys.argv[2], 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['Handle', 'Title', 'Option1 Name', 'Option1 Value', 'Variant SKU', 'Variant Price', 'Variant Inventory Qty', 'Image Src'])
    for base, filas in grupos.items():
        con_peso = len(filas) > 1 and all(p for p, _ in filas)
        for i, (peso, fila) in enumerate(sorted(filas, key=clave) if con_peso else filas):
            primera = i == 0
            titulo = base if con_peso else fila[NOMBRE].strip()   # un producto suelto conserva su nombre, con peso
            w.writerow([handle(titulo),
                        titulo if primera else '',
                        ('Peso' if con_peso else 'Title') if primera else '',
                        peso if con_peso else 'Default Title',
                        fila[SKU], fila[PRECIO], fila[STOCK],
                        fila[IMAGEN].split(',')[0].strip() if primera else ''])
```

Con una muestra inventada deja así los productos: los tres pesos del alimento en un solo producto, ordenados de menor a mayor, y el resto como estaban. Es un punto de partida, no la migración: faltan las descripciones, las categorías y las imágenes de cada variante.

## Antes de escalar, preguntar

Lo más importante del plan no fue el código. Antes de procesar 4.000 productos, le escribimos al cliente para confirmar cuatro cosas:

- Qué atributos generan las variantes: solo el peso, o también la talla o el color.
- Si los SKU o los nombres siguen alguna lógica que permita saber qué productos son del mismo modelo.
- Si las imágenes son del producto general o de cada variante.
- Qué más hay que migrar además del precio, el stock y el SKU: descripciones, categorías, etiquetas.

Cada respuesta cambia el script. Agrupar mal 4.000 productos es peor que no agruparlos.

## Lo que me llevo

- Una migración es la mejor oportunidad para ordenar los datos, y la peor para descubrir que estaban desordenados.
- Prueba con una muestra que tenga la misma forma que el archivo real, y míralo importado antes de escalar.
- Las reglas de negocio ("solo se agrupa lo que tiene peso") van antes que el código.
- El nombre de un producto no es una buena llave. Si el catálogo trae SKU con lógica, úsalos.
