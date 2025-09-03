```text
Leyenda: (PK = clave primaria, FK = clave foránea). 1 = uno, * = muchos.

            +-----------------------+
            |  ClerkUser (externo)  |
            |  PK: user_id (String) |
            +-----------+-----------+
                        |1
        +---------------+-------------------------+--------------------+
        |                                         |                    |
        v                                         v                    v
+-------------------------+        +-------------------------+  +----------------------+
| user_billing_address    |        | user_activity_log       |  | user_permissions    |
| PK: id (BIGSERIAL)      |        | PK: id (BIGSERIAL)      |  | PK: id (BIGSERIAL)  |
| FK: user_id             |        | FK: user_id             |  | FK: user_id         |
+-------------------------+        +-------------------------+  +----------------------+

                                    (relación por price_id)
+-------------------------+           1                 *         +-------------------------+
| user_billing_plans      |-------------------------------------->| user_subscriptions      |
| PK: plan_key (Text)     |                                        | PK: id (BIGSERIAL)     |
| UQ: stripe_price_id     |<------------------------------------+  | FK: user_id            |
| stripe_product_id       |           (suscripción de un user)  |  | FK: stripe_price_id    |
+-------------------------+                                     |  | status, billing_period |
                                                                |  | features[text[]], raw  |
                                                                |  +------------------------+
                                                                |
                                                                +-- referencia lógica 1:* desde
                                                                    ClerkUser.user_id → user_subscriptions.user_id
```
