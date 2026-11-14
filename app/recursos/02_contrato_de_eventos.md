# Contrato y pruebas de eventos

Utiliza este documento antes de instalar etiquetas. Los ejemplos de integración del libro son de un negocio ficticio no sanitario.

## Ficha por evento

Nombre interno:
Significado:
Condición exacta:
Qué NO representa:
Fuente de verdad:
Nombre en cada destino:
Parámetros y valores permitidos:
Datos prohibidos:
Destinos autorizados y finalidad:
Base o elección que permite la operación:
Retención y responsable:
Prevención de duplicados:
Prueba y evidencia:

## Ejemplo de definición

contact_click representa la activación de un enlace de contacto, no un mensaje enviado. Fuente: navegador. Datos de ejemplo: contact_channel y placement. No incluir nombres, correos, teléfonos ni texto libre. La transmisión depende de la política aprobada.

lead_form_success representa aceptación real del backend bajo un contrato definido. Puede mapearse a generate_lead en GA4, sin enviar los dos como éxitos equivalentes. Un evento UUID propio no activa deduplicación universal de GA4.

## Matriz de prueba

| Acción | Estado de privacidad | Evento esperado | Petición esperada | Observado | Resultado |
| --- | --- | --- | --- | --- | --- |
| Clic único | Permitido según diseño | contact_click | Una si procede | | |
| Formulario con error | Cualquier estado | Sin éxito | Sin éxito | | |
| Solicitud aceptada | Permitido según diseño | Un éxito | Una si procede | | |
| Doble clic misma operación | Permitido según diseño | Un éxito | Sin duplicar operación | | |
| Rechazo o retirada | Bloqueo básico aprobado | Sin evento externo | Sin transmisión de esa etiqueta | | |
