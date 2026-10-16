---
title: "El webhook respondía 200 OK y los pedidos nunca llegaban"
description: "Una tienda WooCommerce conectada a Odoo dejó de mandar pedidos al pasar a producción. Todos decían que su parte funcionaba. El registro de entregas de WooCommerce mostró quién tenía razón."
date: 2026-10-10
category: Dev
tags: [WooCommerce, Odoo, Webhooks]
featured: false
---

En el trabajo le hicimos a un cliente su tienda en WooCommerce. Por su lado, con un integrador externo, la conectó a Odoo, un ERP que le maneja productos y pedidos. Mientras el sitio vivió en un subdominio de pruebas, todo funcionaba: cada pedido nuevo de WooCommerce llegaba a Odoo. Después de pasarlo a producción, **a Odoo dejó de llegar ningún pedido**.

Lo raro: en la otra dirección sí funcionaba. Los productos que se cambiaban en Odoo se actualizaban en WooCommerce.

## Todos tenían razón

Nos juntamos con el integrador. Su versión era clara: el endpoint que recibe los pedidos estaba disponible, lo había probado y recibía datos, pero de WooCommerce no le llegaba nada. Desde nuestro lado no se había tocado nada además del traslado, y el integrador había actualizado el webhook para la URL de producción.

Que la integración funcionara en un sentido decía bastante: la conexión entre los dos sistemas existía. El problema estaba en un solo carril, el de los pedidos. O WooCommerce no estaba enviando, o el otro lado recibía y no hacía nada. Había que ver cuál de las dos.

## El registro de entregas se mudó

Un webhook de WooCommerce es simple: cuando pasa algo (en este caso, *pedido creado*), WooCommerce hace un `POST` con los datos del pedido a la URL que le diste. En versiones antiguas, la pantalla de cada webhook mostraba sus últimas entregas. Hoy esa lista no aparece ahí, y fue lo primero que me hizo dudar.

Las entregas ahora quedan en los registros generales:

```text title="dónde está el registro de entregas de los webhooks"
WooCommerce → Estado → Registros → el archivo de entregas de webhooks, con la fecha del día
```

Ahí había un archivo del mismo día. Por cada pedido trae la petición completa (la URL, las cabeceras y el cuerpo) y la respuesta que recibió WooCommerce. La parte que importaba era esta:

```text title="webhook-delivery · la respuesta del otro lado"
[Response] => Array
(
    [Code] => 200
    [Message] => OK
)
```

**WooCommerce sí estaba enviando los pedidos, y el endpoint respondía 200 OK.** Un 200 significa "recibido". No dice que el pedido se haya procesado, solo que alguien contestó que lo tenía.

## Lo que pasa después del 200

Si el receptor contesta 200 y el pedido no aparece en Odoo, el problema está en lo que hace con el pedido después de recibirlo. Con lo que mostraba el registro, había dos sospechosos claros, y los dos tienen que ver con el traslado a producción.

**La firma.** WooCommerce firma cada envío con el *secret* del webhook, una clave que se configura al crearlo, y manda el resultado en la cabecera `X-WC-Webhook-Signature`. El receptor debería calcular la misma firma y descartar lo que no coincida. Si al actualizar el webhook para producción cambió el *secret* y el receptor sigue validando con el anterior, cada pedido llega, recibe un 200 y se descarta en silencio.

```python title="python · cómo se valida la firma de WooCommerce (para el receptor)"
import base64, hashlib, hmac

def firma_valida(cuerpo: bytes, firma_recibida: str, secret: str) -> bool:
    calculada = base64.b64encode(hmac.new(secret.encode(), cuerpo, hashlib.sha256).digest()).decode()
    return hmac.compare_digest(calculada, firma_recibida)
```

**El origen.** WooCommerce también manda la URL del sitio en la cabecera `X-WC-Webhook-Source`. Al pasar a producción, esa URL dejó de ser la del subdominio de pruebas. Si el receptor filtra por origen y sigue esperando la dirección antigua, el resultado es el mismo: 200 y nada más.

Ninguna de las dos se podía comprobar desde WooCommerce: los registros que lo dirían están del lado del integrador.

## La respuesta

Le escribimos al integrador con el registro en la mano: WooCommerce dispara el webhook, envía la firma y recibe un 200 de su endpoint. En vez de decirle "el problema es tuyo", le pedimos que revisara en su sistema la validación de la firma, el origen esperado y lo que pasa con el pedido después de responder. Con eso, la revisión pasó a su lado. Mi parte era demostrar, con registros, que WooCommerce estaba cumpliendo, y ahí terminó.

## Lo que me llevo

- Si algo funciona en un sentido y no en el otro, la conexión está bien. Busca en el carril que falla.
- Antes de discutir de quién es el problema, busca el registro que lo diga. En WooCommerce, el de los webhooks está en Estado → Registros.
- Un 200 OK es un acuse de recibo, no una confirmación de que el trabajo se hizo.
- Pasar de pruebas a producción cambia más cosas de las que parece: la URL, el origen y a veces las claves.
