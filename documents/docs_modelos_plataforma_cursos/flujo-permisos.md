OPEN (Público) USUARIO SIN LOGIN

- Sin login → contenido_publico + mensaje "Regístrate para ver más"

CLERK FREE (Autenticado) USUARIO CON LOGIN NUNCA HA PAGADO

- Con login si En DB2 - tabla: "els_db_lecciones" - campo: "features": ["FREE"] → contenido_privado
- Con login si En DB2 - tabla: "els_db_lecciones" - campo: "features": ["PREMIUM"] → contenido_publico + mensaje "Actualiza a Premium para ver más"

STRIPE PREMIUM (Pagado)

- Con login si En DB2 - tabla: "els_db_lecciones" - campo: "features": ["PREMIUM"] → contenido_privado

  STRIPE PREMIUM (CANCELADO O CADUCADO O PAGO ERROR O SIMILAR)

- Con login si En DB2 - tabla: "els_db_lecciones" - campo: "features": ["PREMIUM"] → contenido_publico + mensaje "Actualiza a Premium para ver más"
