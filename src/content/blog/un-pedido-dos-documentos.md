---
title: "Un pedido, dos clientes y dos documentos tributarios: WooCommerce no duplicó nada"
description: "Una tienda reportó que WooCommerce le había dado el mismo número de pedido a dos compras distintas, una con boleta y otra con factura. Los registros del checkout y dos consultas de solo lectura contaron otra historia."
date: 2026-10-08
category: Dev
tags: [WooCommerce, MySQL, Facturación]
featured: false
---

Una tienda con WooCommerce, cliente nuestra en el trabajo, nos escribió alarmada: **dos clientes distintos tenían el mismo número de pedido**. Una había pedido boleta y la otra factura, y los dos documentos tributarios apuntaban al mismo pedido de WooCommerce. La tienda emite esos documentos con un plugin que conecta WooCommerce con su sistema de facturación electrónica: en el checkout eliges boleta o factura, y el plugin la emite.

Busqué una hora por número, por nombre y por RUT. El pedido de la clienta de la boleta estaba. El de la factura no aparecía por ninguna parte.

## Primero, lo que no puede pasar

En WooCommerce, el número de pedido es el ID con que se guarda en la base de datos, y la base de datos no entrega dos veces el mismo ID. Dos compras no pueden terminar con el mismo número. Si un documento tributario dice lo contrario, el número salió de otro lado, y lo que había que averiguar era de dónde.

## Los registros del checkout

Desde hace algunas versiones, WooCommerce deja un registro por cada intento de compra en **WooCommerce → Estado → Registros**, en archivos que parten con `place-order-debug`. Cada uno trae un identificador único de esa sesión de checkout y lo que pasó al apretar "Realizar pedido".

Revisamos más de 25, del día del problema y del siguiente. Ninguno mostraba un pedido creado dos veces, un ID reutilizado ni un error a mitad de la compra. No estaban todos: según el registro general, algunos de ese día ya se habían borrado solos, porque WooCommerce limpia los registros antiguos y el reclamo llegó una semana después. Con lo que quedaba, cada compra había creado un solo pedido con su propio número.

## Dos consultas que no cambian nada

Faltaba mirar la base de datos directo, en el sitio en producción. La regla era una sola: **solo `SELECT`**, nada que escriba.

```sql title="mysql · ¿existe ese pedido y en qué estado está?"
SELECT ID, post_status, post_date
FROM wp_posts
WHERE ID = 12345;   -- el número que aparece en los documentos
```

```sql title="mysql · todos los pedidos de esos días, incluidos los cancelados y fallidos"
SELECT ID, post_status, post_date
FROM wp_posts
WHERE post_type = 'shop_order'
  AND post_date BETWEEN '2026-01-01' AND '2026-01-04';
```

`wp_` es el prefijo por defecto; el de tu sitio puede ser otro. Y si la tienda usa el almacenamiento nuevo de pedidos de WooCommerce (HPOS), los pedidos viven en `wp_wc_orders` y no en `wp_posts`.

El pedido existía, era uno solo y era el de la clienta de la boleta. Entre los pedidos de esos días no encontramos ninguno que calzara con la compra de la factura. **La factura apuntaba a un pedido que, en WooCommerce, pertenecía a otra persona.**

## Lee tú los documentos

A medio camino, ChatGPT, con el que iba revisando, armó un informe dando por hecho que la boleta y la factura eran de la misma persona: un pedido que se había emitido dos veces. Le pedí que leyera de nuevo los dos PDF, porque no calzaba: pasar de boleta a factura exige datos que la clienta de la boleta nunca ingresó, como el RUT y la razón social de una empresa. Eran dos clientes distintos, y el informe había que rehacerlo.

## La conclusión

Con todo cruzado, lo más probable era que la factura se hubiera emitido fuera del flujo de WooCommerce, a mano o desde el propio sistema de facturación, y que alguien le hubiera asignado el número de un pedido existente. Le enviamos a la tienda un informe con la evidencia (los registros, las consultas y el cruce con los documentos), recomendando revisar esa emisión con su proveedor de facturación. La búsqueda del pedido de la factura quedó abierta en el informe y, si no me falla la memoria, al final apareció: eran dos clientes y dos compras distintas, cada una con su pedido. El número repetido no había salido de WooCommerce. Lo dejamos dicho sin acusar: lo que mostrábamos era que WooCommerce no había duplicado nada, no quién se había equivocado.

## Lo que me llevo

- Antes de buscar el error, pregúntate qué no puede pasar. Un ID duplicado en la base de datos es casi imposible; un número mal copiado entre sistemas, no.
- En producción, las consultas son de solo lectura. Si necesitas cambiar algo, primero un respaldo y después un ambiente de pruebas.
- Los registros `place-order-debug` de WooCommerce son una de las mejores fuentes cuando una compra hace algo raro. Revísalos pronto: no duran para siempre.
- Si una IA te resume un documento, compara su resumen con el documento. El detalle que la contradecía estaba en los datos de facturación.
