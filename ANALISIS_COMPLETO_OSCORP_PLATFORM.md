# ANÁLISIS QUIRÚRGICO COMPLETO - OSCORP PLATFORM
## Documento Técnico-Funcional Exhaustivo para Presentación

---

## 1. RESUMEN EJECUTIVO

**Oscorp Platform** es una plataforma integral de **e-commerce + fintech + e-learning**, diseñada para operar como un ecosistema digital completo. No es simplemente una tienda online: es una suite que combina marketplace multi-vendedor, billetera digital con tarjeta virtual QR, sistema de créditos personales, gestión educativa con cursos, y un programa premium llamado **"Ingenio Millonario"** de educación financiera con suscripción, ruleta de contenidos, seguimiento de etapas y sistema de referidos.

La plataforma soporta **4 roles de usuario** que pueden coexistir en una misma cuenta (sistema multi-rol por array):
- `client` — Comprador, estudiante de cursos, usuario de wallet.
- `seller` — Vendedor con tienda propia, productos, inventario, POS.
- `superadmin` — Administrador total de la plataforma.
- `ingenio` — Acceso al programa premium Ingenio Millonario.

---

## 2. STACK TECNOLÓGICO Y ARQUITECTURA

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 19 + TypeScript + Vite |
| **UI/UX** | Tailwind CSS + shadcn/ui + Radix UI |
| **Estado Global** | Zustand (con persistencia en localStorage) |
| **Query/Cache** | TanStack Query |
| **Formularios** | React Hook Form + Zod |
| **Backend** | Express.js + TypeScript |
| **ORM** | Prisma 6.8.0 |
| **Base de Datos** | PostgreSQL (Neon en producción) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Email** | Nodemailer (Gmail SMTP) con fallback a Demo Mode |
| **Push** | Web Push API (VAPID) |
| **Uploads** | Multer (local/dev) o /tmp (Vercel) |
| **Deploy** | Vercel (frontend + serverless backend) |

### Arquitectura General
- **Monorepo híbrido**: Frontend en `/src/`, backend en `/server/src/`.
- **API RESTful** bajo el prefijo `/api`.
- **Autenticación stateless** mediante JWT almacenado en `localStorage` (`oscorp-token`).
- **CORS configurado** para permitir comunicación entre frontend y backend.
- **Servidor Express** exportado como módulo para Vercel (`export default app`), con listen condicional solo en desarrollo.

---

## 3. MODELO DE DATOS (BASE DE DATOS PRISMA)

La base de datos PostgreSQL contiene **más de 30 modelos** organizados en dominios de negocio. A continuación el desglose funcional de cada dominio:

### 3.1 Identidad y Usuarios
- **`User`**: Núcleo de identidad. Campos clave: `email` (único), `password` (hash), `roles` (array de `UserRole[]`), `initialInterface` (dashboard por defecto), `isVerified` (boolean), `ingenioAccess` (flag para programa premium), `verificationToken` + `verificationTokenExpires` (flujo de verificación por email), `permissions` (JSON flexible), `notificationPrefs` (JSON).
- **`BankData`**: Datos bancarios del usuario para retiros (1:1 con User).

### 3.2 Marketplace (Vendedores)
- **`SellerProfile`**: Perfil comercial separado de la identidad. Incluye `storeName`, `storeSlug` (único), `logo`, `banner`, `isVerified`, `planActive`, `planExpiryDate`, `commissionRate` (default 5%), métricas (`totalSales`, `totalRevenue`, `rating`, `reviewCount`), `businessHours` (JSON), `socialLinks` (JSON).
- **`Store`**: Vista pública de la tienda (1:1 con SellerProfile). `slug` único, `isOnline`, `isActive`.
- **`Supplier`**: Proveedores de un vendedor para gestión de inventario.
- **`Customer`**: Clientes locales registrados por el vendedor (CRM interno/POS).

### 3.3 Productos e Inventario
- **`Product`**: Catálogo del vendedor. SKU único, `price`, `cost`, `profitPercentage`, `comparePrice` (ofertas), `type` (`physical`, `service`, `digital`), `visibility` (`online`, `local`, `both`), `images` (array de strings), `tags` (array), `dimensions`, `weight`.
- **`ProductVariant`**: Variantes por producto (color, talla) con precio y stock propio.
- **`ProductAttribute`**: Especificaciones dinámicas clave-valor.
- **`Purchase` / `PurchaseItem`**: Registro de compras del vendedor a proveedores.
- **`StockMovement`**: Trazabilidad completa de entradas/salidas/ajustes de inventario.

### 3.4 Finanzas Personales
- **`Wallet`**: Billetera digital 1:1 con User. `balance`, `currency` (default USD/PYG), `dailyLimit`, `monthlyLimit`, `totalIn`, `totalOut`, `transactionPin` (hash para seguridad de transacciones).
- **`VirtualCard`**: Tarjeta virtual QR asociada a wallet. `cardNumber` (único), `qrCode`, `qrData`, `design` (`gradient_blue`, `gradient_purple`, `gradient_dark`, `minimal`).
- **`Transaction`**: Ledger completo de movimientos. `type` enum con 11 valores: `income`, `expense`, `transfer_in`, `transfer_out`, `purchase`, `sale`, `withdrawal`, `deposit`, `commission`, `credit`, `fee`. Soporta referencias cruzadas (`relatedUserId`, `relatedOrderId`, `relatedCreditId`) y `metadata` JSON.

### 3.5 Órdenes y Logística
- **`Order`**: Pedidos del marketplace. `orderNumber` (único), `buyerId`, `sellerId`, desglose monetario (`subtotal`, `tax`, `shippingCost`, `discount`, `total`), `status` (8 estados desde `pending` hasta `refunded`), `paymentStatus`, `paymentMethod`, `deliveryType`, `deliveryAddress` (JSON), `commissionAmount`, `sellerEarnings`.
- **`OrderItem`**: Snapshot inmutable de cada línea del pedido.
- **`TrackingEvent`**: Trazabilidad logística de cambios de estado.

### 3.6 E-Learning
- **`Course`**: Cursos publicados. `slug` único, `instructorId`, `instructorName`, `category`, `level` (`beginner`, `intermediate`, `advanced`), `price`, `comparePrice`, `duration`, `isPublished`, `isFeatured`, `enrolledCount`, `rating`, `reviewCount`.
- **`Module`**: Módulos/contenedores de un curso, ordenados.
- **`Lesson`**: Lecciones dentro de módulo. `videoUrl`, `duration`, `isPreview`.
- **`Resource`**: Materiales adjuntos (video, documento, link) a nivel de `Course` o `Lesson`.
- **`UserCourse`**: Inscripción y progreso. `status`, `progress` (0-100), `completedModules`/`completedLessons` (arrays de IDs), `totalTimeSpent`, `certificateIssued`.

### 3.7 Créditos
- **`Credit`**: Solicitudes de crédito. `amount`, `concept`, `installments`, `installmentAmount`, `totalToPay`, `interestRate`, `status` (`pending`, `approved`, `rejected`, `active`, `completed`, `defaulted`, `cancelled`), `approvedBy`, `approvedAt`.
- **`CreditDocument`**: Documentación adjunta (cédula, comprobante de ingresos).
- **`PaymentScheduleItem`**: Tabla de amortización detallada por cuota.
- **`CreditPayment`**: Pagos reales realizados contra cuotas.

### 3.8 Contabilidad Personal
- **`FinancialCategory`**: Categorías personalizadas de ingresos/gastos.
- **`FinancialRecord`**: Movimientos contables. Soporta transacciones recurrentes (`isRecurring`, `recurrencePattern`) y `attachments` (array de URLs).
- **`Budget`**: Presupuesto mensual global (`incomeGoal`, `expenseLimit`, `categoryLimits` JSON).
- **`BudgetItem`**: Metas de ahorro o gasto por período con seguimiento de progreso manual.

### 3.9 Notificaciones y Marketing
- **`Notification`**: Notificaciones in-app/push por usuario. `title`, `message`, `type`, `isRead`, `imageUrl`, `actionUrl`, `clickedAt`.
- **`Campaign`**: Campañas masivas de notificaciones. `targetRole`, `status` (`draft`, `sent`), `sentAt`.
- **`PushSubscription`**: Suscripciones del navegador para Web Push API.

### 3.10 Ingenio Millonario (Dominio Premium)
- **`IngenioSubscription`**: Suscripción de usuario al programa. Estados: `PENDING_PAYMENT`, `PENDING_APPROVAL`, `ACTIVE`, `REVOKED`. `totalAmount`, `installments`, `paidAmount`, `paymentMethod` (`WALLET`, `BANK_TRANSFER`).
- **`IngenioStage`**: Etapas educativas (ej: E1, E2). `name`, `title`, `description`, `color`, `order`, `isActive`.
- **`IngenioWheelSegment`**: Segmentos de la "ruleta" de contenidos de una etapa. `number` (1-10), `title`, `description` (texto largo), `color`, `icon`, `order`.
- **`IngenioContent`**: Contenido educativo asociado a etapa/segmento. `type` (video, documento, link, text), `title`, `content` (texto largo), `url`, `fileUrl`.
- **`IngenioMaterial`**: Materiales descargables organizados por etapa. `stage`, `title`, `fileUrl`, `fileType`, `segmentNumber`, `fileSize`, `isPublic`.
- **`IngenioStudent`**: Perfil de estudiante en el programa. `phone`, `city`, `country` (default Paraguay), `occupation`, `experience`, `goals`, `referralCode` (único), `referredById` (sistema de referidos), `joinedAt`, `isActive`.
- **`IngenioStudentAssignment`**: Asignaciones de etapas a estudiantes. `studentId`, `stage` (ej: E1), `status` (`pending`, `in_progress`, `completed`), `progress` (0-100), `assignedAt`, `startedAt`, `completedAt`, `notes`.

### 3.11 Carrito y Reseñas
- **`CartItem`**: Ítems en carrito de compras (`@@unique([userId, productId])`).
- **`Review`**: Reseñas de productos o tiendas con `rating` y `comment`.

### Enums Clave
- `UserRole`: `client`, `seller`, `superadmin`, `ingenio`
- `OrderStatus`: `pending`, `confirmed`, `preparing`, `ready`, `in_transit`, `delivered`, `cancelled`, `refunded`
- `PaymentStatus`: `pending`, `paid`, `failed`, `refunded`
- `PaymentMethod`: `wallet`, `cash`, `card`, `transfer`
- `ProductType`: `physical`, `service`, `digital`
- `CourseLevel`: `beginner`, `intermediate`, `advanced`
- `CreditStatus`: `pending`, `approved`, `rejected`, `active`, `completed`, `defaulted`, `cancelled`
- `IngenioSubscriptionStatus`: `PENDING_PAYMENT`, `PENDING_APPROVAL`, `ACTIVE`, `REVOKED`

---

## 4. MÓDULO DE AUTENTICACIÓN, REGISTRO Y SEGURIDAD

Este es el núcleo de acceso a la plataforma. El sistema implementa un flujo completo de autenticación con verificación de email, control de roles y protección de rutas.

### 4.1 Flujo de Registro (`POST /api/auth/register`)
1. **Validaciones estrictas**: email obligatorio y con formato válido, password mínimo 8 caracteres con al menos 1 letra y 1 número.
2. **Anti-duplicado**: Verifica que el email no exista ya en `User`.
3. **Hash de contraseña**: Usa `bcryptjs` con salt rounds 10.
4. **Generación de token de verificación**: Usa `crypto.randomBytes(32)` → hex. Expira en 24 horas.
5. **Creación de usuario**: `isVerified: false`, `ingenioAccess: false`, avatar auto-generado con DiceBear API.
6. **Wallet automática**: Si el rol incluye `client` o `seller`, se crea una `Wallet` con balance 0 y una `VirtualCard` con número único `OSC{random}` y QR data JSON.
7. **Perfil de vendedor**: Si el rol incluye `seller`, se crea `SellerProfile` con tienda default (`{firstName}'s Store`), slug único, y plan de prueba de 7 días.
8. **Envío de email de verificación**:
   - Si están configuradas las variables `SMTP_USER` y `SMTP_PASS`, envía email real vía Nodemailer usando Gmail.
   - Email HTML profesional con botón "Verificar mi cuenta" que apunta a `/login?verify={token}`.
   - Si no hay SMTP configurado, entra en **Demo Mode**: loguea el token en consola y devuelve `demoToken` en la respuesta JSON.
9. **Auto-login post-registro**: Genera JWT y devuelve el usuario completo (sin password).

### 4.2 Verificación de Email (`GET /api/auth/verify?token=...`)
- Busca usuario por `verificationToken`.
- Valida que no haya expirado (`verificationTokenExpires > now()`).
- Actualiza `isVerified: true` y limpia los campos de token.
- Retorna JSON de éxito.
- **Importante**: El login bloquea explícitamente a usuarios no verificados (`isVerified === false`) con error 403.

### 4.3 Flujo de Login (`POST /api/auth/login`)
1. **Mensajes genéricos anti-enumeración**: Tanto si el email no existe como si la contraseña es incorrecta, retorna exactamente el mismo mensaje: "Credenciales incorrectas".
2. **Validación de contraseña** con `bcrypt.compare`.
3. **Chequeo de estado**: Solo después de validar la contraseña verifica `isActive`. Si está desactivado, 403 con mensaje específico.
4. **Chequeo de verificación**: Si `isVerified === false`, bloquea con 403.
5. **Generación de JWT**: Payload incluye `userId`, `email`, `roles`. Expiración configurable (default 7 días en `JWT_EXPIRES_IN`).
6. **Respuesta enriquecida**: Devuelve token + usuario completo con relaciones: `wallet`, `virtualCard`, `sellerProfile`, `bankData`, `ingenioSubscription`.

### 4.4 Gestión de Sesión y Usuario Actual
- **`GET /api/auth/me`**: Retorna el usuario autenticado con todas sus relaciones.
- **`PUT /api/auth/me`**: Actualiza datos básicos del perfil (`firstName`, `lastName`, `phone`, `address`, `city`, `avatar`).
- **`PUT /api/auth/me/password`**: Cambio de contraseña con validación de contraseña actual.
- **`POST /api/auth/add-role`**: Permite agregar roles dinámicamente. Si se agrega `client` y no tiene wallet, la crea automáticamente junto con virtual card. Devuelve nuevo token con roles actualizados.

### 4.5 Middleware de Seguridad
- **`authenticate`** (`server/src/middleware/auth.ts`):
  - Extrae token del header `Authorization: Bearer <token>`.
  - Usa `verifyToken` de JWT. Si expiró, devuelve error específico "El token ha expirado".
  - Si es inválido, 401.
- **`authorize(...roles)`**:
  - Verifica que `req.user.roles` tenga al menos uno de los roles permitidos.
  - 403 si no tiene permisos.
- **`requireActiveSubscription`** (`server/src/middleware/ingenio.ts`):
  - Excepción para `superadmin`.
  - Verifica `user.ingenioAccess === true` o que exista una `IngenioSubscription` con `status === 'ACTIVE'`.
  - Si no, bloquea con código `REQUIRES_SUBSCRIPTION`.

### 4.6 Protección de Rutas en Frontend
- Componente `ProtectedRoute` en `App.tsx`.
- Verifica `isAuthenticated` y que el usuario tenga al menos uno de los `allowedRoles`.
- Si no tiene acceso, redirige al dashboard correspondiente a su rol principal.

---

## 5. MÓDULO DE USUARIOS Y ADMINISTRACIÓN (`/api/users`)

### 5.1 Gestión de Perfiles
- **`PUT /api/users/profile`**: Actualiza perfil del usuario actual. Soporta campo `name` combinado que se separa en `firstName` y `lastName`.
- **`PUT /api/users/change-password`**: Cambio de contraseña (duplicado funcional de `/auth/me/password`).
- **`PUT /api/users/me/bank-data`**: Upsert de datos bancarios (`bankName`, `accountNumber`, `accountType`, `holderName`, `documentId`).

### 5.2 Preferencias de Notificación
- **`GET /api/users/me/preferences`**: Devuelve preferencias con defaults:
  ```json
  { pushNotifications: true, emailNotifications: true, orderAlerts: true, lowStockAlerts: true, promotionAlerts: false, securityAlerts: true, newReviewAlerts: true, weeklyReport: false }
  ```
- **`PUT /api/users/me/preferences`**: Guarda objeto JSON completo en `User.notificationPrefs`.

### 5.3 Administración de Usuarios (superadmin)
- **`GET /api/users`**: Lista todos los usuarios con `wallet` y `sellerProfile`, ordenados por `createdAt` desc. Elimina password de la respuesta.
- **`GET /api/users/search?query=`**: Búsqueda de usuarios por email, nombre, apellido o teléfono (mínimo 3 caracteres). Excluye al usuario actual. Usado para transferencias de wallet.
- **`GET /api/users/:id`**: Obtiene usuario por ID. Solo admin o el propio usuario.
- **`PATCH /api/users/:id/status`**: Activa/desactiva usuario (`isActive`).
- **`PUT /api/users/:id`**: Actualiza datos de usuario incluyendo `roles` y `password` (hasheada si se provee). Si se agrega rol `client` sin wallet, la crea automáticamente con virtual card.
- **`DELETE /api/users/:id`**: Elimina usuario físicamente (cascade en Prisma).

### 5.4 Perfil de Vendedor
- **`PUT /api/users/seller-profile`** (seller only): Upsert del `SellerProfile`. Valida `storeSlug` con regex `^[a-z0-9]+(?:-[a-z0-9]+)*$` y unicidad. Si no existe perfil, lo crea con plan de prueba 7 días.
- **`PUT /api/users/:id/seller-profile`** (admin only): Permite editar perfil de cualquier vendedor.

### 5.5 Control de Acceso a Ingenio Millonario
- **`PATCH /api/users/:id/ingenio`** (admin only):
  - Recibe `{ hasAccess: boolean }`.
  - Si `hasAccess = true`:
    - Agrega rol `ingenio` al usuario.
    - Crea/actualiza `IngenioSubscription` a `ACTIVE` con `ADMIN_MANUAL` como método y monto default desde `systemSetting` (`ingenio_price`, default 700000).
    - Crea `IngenioStudent` con código de referido aleatorio si no existe.
  - Si `hasAccess = false`:
    - Elimina `IngenioSubscription` y `IngenioStudent` asociados (reset limpio).
    - Mantiene el rol `ingenio` en el usuario pero desactiva el flag.

### 5.6 Asignación de Cursos
- **`POST /api/users/:id/courses/:courseId`**: Asigna curso a usuario (upsert de `UserCourse` a `status: active`).
- **`DELETE /api/users/:id/courses/:courseId`**: Elimina acceso al curso.

### 5.7 Upgrade a Cliente
- **`POST /api/users/upgrade-to-client`**: Agrega rol `client` y crea wallet/virtual card si no existen.

---

## 6. MÓDULO MARKETPLACE / E-COMMERCE

### 6.1 Productos (`/api/products`)
- **`GET /api/products`**: Lista pública. Filtros por `category`, `search` (insensitive en nombre/descripción), `sellerId`. Si no se pasa `sellerId`, solo muestra productos `status: active`. Incluye `seller`, `variants`, `attributes`, `supplier`.
- **`GET /api/products/featured`**: Top 10 productos `active` + `isFeatured`.
- **`GET /api/products/:id`**: Detalle público de producto con tienda del vendedor.
- **`POST /api/products`**: Creación por vendedor o admin. Valida SKU único. Soporta creación anidada de `attributes` y `variants`.
- **`PUT /api/products/:id`**: Actualización. Solo el dueño del producto o superadmin.
- **`DELETE /api/products/:id`**: Eliminación física con validación de ownership.

### 6.2 Órdenes (`/api/orders`)
- **`GET /api/orders?as=`**: Lista órdenes. Superadmin con `as=admin` ve todas. Seller con `as=seller` ve las suyas. Cliente ve las que compró. Incluye items, datos de buyer/seller, e historial de tracking.
- **`GET /api/orders/:id`**: Detalle completo. Verificación de ownership (buyer, seller o admin).
- **`POST /api/orders`**: Creación de orden compleja:
  1. Resuelve `sellerId` real desde `SellerProfile.id` a `User.id`.
  2. Calcula subtotal recorriendo items y validando existencia de productos.
  3. Calcula comisión del 5% (`commissionAmount`) y ganancia del vendedor (`sellerEarnings`).
  4. Genera `orderNumber` único (`ORD-${Date.now()}`).
  5. Si pago es `wallet`, valida saldo suficiente.
  6. **Transacción atómica** (`prisma.$transaction`):
     - Crea orden con items y evento inicial de tracking.
     - Si pago wallet: descuenta del comprador, acredita al vendedor (menos comisión), crea transacciones `purchase` y `sale`, marca orden como `paymentStatus: paid`.
     - Decrementa stock de cada producto.
  7. **Notificaciones asíncronas** (post-respuesta):
     - Notificación en DB + Web Push al comprador.
     - Notificación en DB + Web Push al vendedor.
- **`PATCH /api/orders/:id/status`**: Actualización de estado. Solo seller o admin. Agrega `TrackingEvent`. Envía notificación push al comprador sobre el cambio.

---

## 7. MÓDULO WALLET / BILLETERA DIGITAL Y TARJETA QR (`/api/wallet`)

Este es uno de los módulos más robustos. Cada usuario con rol `client` o `seller` tiene una wallet y tarjeta virtual generadas automáticamente.

### 7.1 Consultas
- **`GET /api/wallet`**: Devuelve wallet del usuario autenticado con últimas 50 transacciones.
- **`GET /api/wallet/transactions?limit=&offset=`**: Historial paginado de transacciones.
- **`GET /api/wallet/all-transactions`**: Admin only. Lista TODAS las transacciones de la plataforma con datos de usuario.

### 7.2 Depósitos
- **`POST /api/wallet/deposit`**:
  - Incrementa `balance` y `totalIn`.
  - Crea transacción tipo `deposit`.
  - Envía **Web Push** al usuario: "Deposito acreditado".

### 7.3 Transferencias P2P
- **`POST /api/wallet/transfer`**:
  - Recibe `{ toUserId, amount, description, pin }`.
  - **Verificación de PIN**: Si el usuario configuró `transactionPin`, se exige un PIN de 4 dígitos y se valida con bcrypt.
  - Valida saldo suficiente.
  - Transacción atómica:
    - Descuenta de wallet origen (incrementa `totalOut`).
    - Acredita a wallet destino (incrementa `totalIn`).
    - Crea transacción `transfer_out` para emisor y `transfer_in` para receptor.
  - Envía **Web Push** al receptor: "Transferencia recibida de {Nombre}".

### 7.4 Retiros
- **`POST /api/wallet/withdraw`**:
  - Valida saldo.
  - Descuenta de wallet.
  - Crea transacción tipo `withdrawal` con `status: pending` (requiere aprobación manual/admin).

### 7.5 PIN de Seguridad
- **`GET /api/wallet/pin-status`**: Indica si el usuario ya tiene PIN.
- **`POST /api/wallet/pin/set`**: Configura PIN de 4 dígitos por primera vez (hash bcrypt).
- **`POST /api/wallet/pin/change`**: Cambia PIN validando el actual.

### 7.6 Tarjeta Virtual QR
- **`GET /api/wallet/card`**: Obtiene datos de la `VirtualCard` del usuario.
- **`PATCH /api/wallet/card/design`**: Cambia el diseño visual de la tarjeta.
- La tarjeta tiene un `cardNumber` único tipo `OSCXXXXXX` y `qrData` en JSON con `userId` y `cardNumber`.
- En el frontend (`ClientCard`, `ClientScan`), se muestra como código QR escaneable para pagos P2P o en tiendas físicas (POS del vendedor).

---

## 8. MÓDULO DE CRÉDITOS (`/api/credits`)

Sistema completo de préstamos personales con tablas de amortización.

### 8.1 Flujo del Cliente
- **`GET /api/credits`**: Mis créditos con documentos, tabla de pagos y pagos realizados.
- **`POST /api/credits`**: Solicitar crédito:
  - Recibe `amount`, `concept`, `installments`, `interestRate`.
  - Calcula interés total: `(amount * interestRate * installments) / 100`.
  - Calcula `totalToPay` y `installmentAmount`.
  - Genera tabla de amortización (`PaymentScheduleItem`) con vencimientos mensuales.
  - Estado inicial: `pending`.
- **`PUT /api/credits/:id`**: Editar crédito pendiente (recalcula toda la tabla de amortización).
- **`PATCH /api/credits/:id/cancel`**: Cancelar crédito pendiente. Limpia archivos subidos y elimina documentos/schedule.
- **`DELETE /api/credits/:id`**: Eliminar crédito pendiente (similar a cancelar pero físico).
- **`POST /api/credits/:id/pay`**:
  - Paga una cuota específica (`installmentId`) desde la wallet.
  - Valida saldo suficiente.
  - Crea `CreditPayment`, marca cuota como `paid`, y si todas las cuotas están pagadas, cambia estado del crédito a `completed`.
  - Crea transacción de tipo `expense` en la wallet.

### 8.2 Administración de Créditos
- **`GET /api/credits/admin/all`**: Lista TODOS los créditos de todos los usuarios (superadmin).
- **`GET /api/credits/:id`**: Detalle de un crédito específico (solo admin o dueño).
- **`PATCH /api/credits/:id/approve`**:
  - Cambia estado a `active`.
  - Acredita el monto total del crédito a la wallet del usuario.
  - Crea transacción tipo `credit`.
  - Envía notificación DB + Web Push al usuario.
- **`PATCH /api/credits/:id/reject`**:
  - Cambia estado a `rejected`.
  - Opcionalmente recibe `reason`.
  - Envía notificación DB + Web Push.

### 8.3 Documentación
- **`POST /api/credits/:id/documents`**:
  - Upload múltiple de imágenes (max 4 archivos, 5MB cada uno, formatos: JPEG, PNG, WebP, HEIC, HEIF) vía Multer.
  - Guarda en `/server/uploads/documents/` o `/tmp/uploads/documents/` en Vercel.
  - Asocia cada archivo como `CreditDocument` con `type`: `id_front`, `id_back`, `proof_income`, `other`.

---

## 9. MÓDULO E-LEARNING / CURSOS (`/api/courses`)

### 9.1 Catálogo Público
- **`GET /api/courses`**: Lista cursos publicados (`isPublished: true`). Filtros por `category`, `level`, `search`. Incluye módulos, lecciones, recursos y progreso de usuarios inscritos.
- **`GET /api/courses/slug/:slug`**: Detalle de curso por slug (página pública de curso).
- **`GET /api/courses/:id`**: Detalle por ID con `userCourses` incluyendo datos de usuarios inscritos.

### 9.2 Gestión Administrativa (superadmin)
- **`POST /api/courses`**: Crea curso generando slug automáticamente desde el título (`title.toLowerCase().replace(...) + '-' + Date.now()`). Instructor default = admin actual.
- **`PUT /api/courses/:id`** / **`PATCH /api/courses/:id`**: Actualiza cualquier campo del curso.
- **`DELETE /api/courses/:id`**: Elimina curso y todo su contenido en cascada (módulos, lecciones, recursos, inscripciones).

### 9.3 Estructura de Contenido
- **`POST /api/courses/:id/modules`**: Agrega módulo. Calcula `order` automáticamente como último + 1.
- **`PUT /api/courses/modules/:moduleId`**: Edita título, descripción, orden.
- **`DELETE /api/courses/modules/:moduleId`**: Elimina módulo y sus lecciones.
- **`POST /api/courses/modules/:moduleId/lessons`**: Agrega lección con `videoUrl`, `duration`, `isPreview`.
- **`PUT /api/courses/lessons/:lessonId`**: Edita lección.
- **`DELETE /api/courses/lessons/:lessonId`**: Elimina lección.
- **`POST /api/courses/resources`**: Agrega recurso (PDF, imagen, video, link) a un `courseId` o `lessonId`.
- **`DELETE /api/courses/resources/:resourceId`**: Elimina recurso.

### 9.4 Inscripciones y Progreso
- **`GET /api/courses/my/enrollments`**: Mis cursos inscritos con todo el contenido anidado.
- **`POST /api/courses/:id/enroll`**: Auto-inscripción:
  - Si el curso es gratuito o el usuario tiene suscripción Ingenio activa / `ingenioAccess` / es superadmin → inscribe gratis.
  - Si el curso es de pago y no tiene acceso premium, verifica saldo en wallet y descuenta el precio.
  - Incrementa `enrolledCount` del curso.
  - Crea `UserCourse` con `status: active`.
- **`POST /api/courses/:id/request`**: Solicita acceso a curso. Crea notificaciones en DB para TODOS los admins.
- **`GET /api/courses/:id/access`**: Admin ve lista de usuarios inscritos a un curso.
- **`POST /api/courses/:id/assign`**: Admin asigna usuario a curso manualmente. También activa `ingenioAccess: true` del usuario.
- **`DELETE /api/courses/:id/access/:accessId`**: Admin revoca acceso. Decrementa `enrolledCount`.
- **`PATCH /api/courses/access/:accessId/progress`**: Actualiza progreso del estudiante:
  - Marca/desmarca una lección como completada (add/remove de `completedLessons` array).
  - Recalcula `progress` como porcentaje de lecciones completadas / total de lecciones del curso.
  - Si `progress === 100`, marca `completedAt` y `status` completado.

---

## 10. MÓDULO INGENIO MILLONARIO (SISTEMA PREMIUM)

Este es el **módulo estrella y más complejo** de la plataforma. Es un programa de educación financiera con acceso por suscripción, estructurado en etapas (E1, E2), cada una con una "ruleta" de 10 principios/pasos, contenido educativo, materiales descargables, academia de cursos, presupuestos financieros, reportes de progreso y sistema de referidos.

### 10.1 Estructura Educativa: Etapas y Ruleta

#### Modelo Pedagógico
- **Etapas (`IngenioStage`)**: Contenedores de alto nivel. Ejemplos: `E1 - Fundamentos`, `E2 - Maestría Financiera`.
- **Segmentos (`IngenioWheelSegment`)**: Cada etapa tiene exactamente 10 segmentos numerados del 1 al 10. Cada segmento representa un principio financiero:
  - E1: Poder del Dinero, Crear más Dinero, Manejar el Dinero, Proteger el Dinero, Ahorrar el Dinero, Crecer el Dinero, Preservar el Dinero, Invertir el Dinero, Donar el Dinero, Disfrutar el Dinero.
  - E2: Mentalidad Ganadora, Metas Claras, Plan de Acción, Ingresos Múltiples, Inversión Inteligente, Red de Contactos, Educación Continua, Disciplina Financiera, Dar para Recibir, Legado Duradero.
- **Contenidos (`IngenioContent`)**: Cada etapa puede tener múltiples contenidos asociados a un segmento específico o a la etapa en general. Tipos: `video`, `documento`, `link`, `text`.
- **Materiales (`IngenioMaterial`)**: Archivos descargables (PDFs, documentos) organizados por etapa y segmento.

#### APIs de Gestión de Contenido
- **`GET /api/ingenio/stages`**: Lista etapas con conteo de segmentos y contenidos.
- **`POST /api/ingenio/stages`** (admin): Crea etapa.
- **`PUT /api/ingenio/stages/:id`** (admin): Edita etapa.
- **`DELETE /api/ingenio/stages/:id`** (admin): Elimina etapa.
- **`GET /api/ingenio/segments/:stageId`**: Lista segmentos de una etapa.
- **`POST /api/ingenio/segments`** (admin): Crea segmento.
- **`PUT /api/ingenio/segments/:id`** (admin): Edita segmento.
- **`DELETE /api/ingenio/segments/:id`** (admin): Elimina segmento.
- **`GET /api/ingenio/contents/:stageId`**: Lista contenidos de etapa.
- **`POST /api/ingenio/contents`** (admin): Crea contenido.
- **`PUT /api/ingenio/contents/:id`** (admin): Edita contenido.
- **`DELETE /api/ingenio/contents/:id`** (admin): Elimina contenido.
- **`GET /api/ingenio/materials?stage=`**: Lista materiales descargables.
- **`POST /api/ingenio/materials`** (admin): Crea material.
- **`PUT /api/ingenio/materials/:id`** (admin): Edita material.
- **`DELETE /api/ingenio/materials/:id`** (admin): Elimina material.

### 10.2 Setup/Inicialización del Sistema
- **`POST /api/ingenio/setup`** (admin):
  - Verifica que no haya etapas existentes.
  - Crea automáticamente las etapas E1 y E2 con sus 10 segmentos cada una, incluyendo títulos, descripciones y colores distintivos.
  - Crea automáticamente dos cursos en el sistema de e-learning (`E1 - Fundamentos del Dinero`, `E2 - Maestría Financiera`) vinculados al admin como instructor.
  - Devuelve conteo de stages, segments y courses creados.

### 10.3 Suscripciones y Pagos

#### Estados de Suscripción
1. `PENDING_PAYMENT`: Solicitado pero sin pago.
2. `PENDING_APPROVAL`: Pago realizado pero requiere aprobación manual del admin (especialmente transferencias bancarias).
3. `ACTIVE`: Acceso completo concedido.
4. `REVOKED`: Acceso cancelado por admin (puede restaurarse pagando deuda pendiente).

#### Flujo de Suscripción (`/api/ingenio/subscribe`)
- El usuario elige número de cuotas (`installments`, configurable por admin en `systemSetting` `ingenio_max_installments`, default 3) y método de pago (`WALLET` o `BANK_TRANSFER`).
- Precio configurable en `systemSetting` `ingenio_price` (default 700000, moneda local Paraguay — Guaraníes).
- Si elige **WALLET**:
  - Valida saldo suficiente.
  - Calcula monto a pagar: si es primera vez, paga el monto de una cuota. Si ya tenía suscripción revocada o está pagando cuotas pendientes, calcula la cuota actual.
  - Transacción atómica:
    - Descuenta wallet.
    - Crea transacción tipo `expense` con descripción del pago de cuota.
    - Hace upsert de `IngenioSubscription` incrementando `paidAmount`.
    - Si estaba `REVOKED`, restaura a `ACTIVE` y devuelve `ingenioAccess: true`.
  - Respuesta: "Pago realizado con éxito. Pendiente de aprobación" (o "Tu acceso ha sido restaurado" si era revocado).
- Si elige **BANK_TRANSFER**:
  - Solo actualiza/crea la suscripción a `PENDING_APPROVAL`.
  - El admin debe aprobar manualmente ingresando el monto recibido.

#### APIs de Suscripción (Usuario)
- **`GET /api/ingenio/config`**: Obtiene configuración pública: precio, máximo de cuotas, teléfono de contacto.
- **`GET /api/ingenio/subscription/me`**: Estado de mi suscripción.
- **`POST /api/ingenio/subscribe`**: Procesar suscripción o pago de cuota.

#### APIs de Suscripción (Admin)
- **`GET /api/ingenio/admin/subscriptions`**: Lista todas las suscripciones con datos del usuario.
- **`PUT /api/ingenio/admin/subscriptions/:id/approve`**:
  - Recibe `amountPaid` (para registrar pagos parciales o totales de transferencias).
  - Valida que el monto ingresado no supere la deuda pendiente (`totalAmount - paidAmount`).
  - Actualiza suscripción a `ACTIVE`, incrementa `paidAmount`, setea `approvedAt`.
  - Activa `ingenioAccess: true` en el usuario.
- **`PUT /api/ingenio/admin/subscriptions/:id/revoke`**:
  - Cambia estado a `REVOKED`.
  - Desactiva `ingenioAccess: false`.
- **`DELETE /api/ingenio/admin/subscriptions/:id`**:
  - Elimina la suscripción.
  - Desactiva `ingenioAccess: false`.
  - Elimina el perfil de estudiante (`IngenioStudent`), haciendo un reset total.

### 10.4 Estudiantes y Perfil
- **`GET /api/ingenio/students`** (admin): Lista todos los estudiantes con datos de usuario, asignaciones y conteo de referidos.
- **`GET /api/ingenio/students/me`**: Mi perfil de estudiante con asignaciones y lista de referidos.
- **`POST /api/ingenio/students/register`**: Registro como estudiante:
  - Recibe datos personales: `phone`, `city`, `country`, `occupation`, `experience`, `goals`, `referralCode` (opcional, código de quien lo refirió).
  - Genera un `referralCode` único aleatorio para el nuevo estudiante.
  - Si proporcionó código de referido, busca al referente y vincula `referredById`.
  - Crea `IngenioStudent` y activa `ingenioAccess: true` en el usuario.
- **`PUT /api/ingenio/students/me`**: Actualiza perfil de estudiante. Requiere suscripción activa (`requireActiveSubscription`).

### 10.5 Asignaciones y Progreso de Etapas
- **`GET /api/ingenio/assignments/me`**: Mis asignaciones de etapas.
- **`POST /api/ingenio/assignments`** (admin): Admin asigna una etapa (E1, E2) a un estudiante.
- **`POST /api/ingenio/assignments/:id/start`**: El estudiante inicia una asignación. Cambia `status` a `in_progress` y setea `startedAt`.
- **`PUT /api/ingenio/assignments/:id/progress`**: Actualiza progreso (`0-100`). Si llega a 100, marca `status: completed` y `completedAt`.

### 10.6 Estadísticas
- **`GET /api/ingenio/stats`** (admin): Métricas del programa:
  - `totalStudents`, `activeStudents`
  - `totalAssignments`, `completedAssignments`
  - `e1Count`, `e2Count`

### 10.7 Ruleta Pública
- **`GET /api/ingenio/public/wheel/:stageName`**: Obtiene los segmentos de una etapa para mostrar la ruleta visual en el frontend (accesible públicamente o con auth según implementación frontend).

---

## 11. MÓDULO DE NOTIFICACIONES, CAMPAÑAS Y PUSH

### 11.1 Notificaciones In-App (`/api/notifications`)
- **`GET /api/notifications`**: Últimas 50 notificaciones del usuario actual.
- **`PATCH /api/notifications/read-all`**: Marca todas como leídas.
- **`PATCH /api/notifications/:id/read`**: Marca una como leída. Valida ownership.
- **`PATCH /api/notifications/:id/click`**: Registra click y automáticamente marca como leída (`clickedAt`).
- **`POST /api/notifications/broadcast`** (admin): Envía notificación masiva a todos los usuarios o a un rol específico. Crea registros en DB en batch con `createMany`.

### 11.2 Campañas (`/api/campaigns`)
- CRUD completo de campañas de marketing (solo admin).
- **`GET /api/campaigns`**: Lista campañas con estadísticas calculadas dinámicamente:
  - `sent`: total de notificaciones creadas.
  - `read`: cuántas fueron leídas.
  - `clicked`: cuántas recibieron click.
  - `readRate` y `clickRate` en porcentajes.
- **`POST /api/campaigns`**: Crea campaña en estado `draft` o `sent` (si `sendNow = true`).
- **`PUT /api/campaigns/:id`**: Edita solo campañas en `draft`.
- **`DELETE /api/campaigns/:id`**: Elimina campaña.
- **`POST /api/campaigns/:id/send`**: Envía una campaña draft. Cambia estado a `sent`, crea notificaciones masivas en DB y dispara Web Push.

### 11.3 Web Push API (`/api/push`)
- **`GET /api/push/vapid-public-key`**: Entrega la clave pública VAPID al cliente para suscripción del Service Worker.
- **`POST /api/push/subscribe`**: Registra/actualiza suscripción push del navegador (`endpoint`, `p256dh`, `auth`). Upsert por `endpoint`.
- **`POST /api/push/unsubscribe`**: Desactiva suscripción (`isActive: false`).
- **`GET /api/push/status`**: Indica si el usuario actual tiene al menos una suscripción push activa.
- **`GET /api/push/stats`** (admin): Total de suscripciones activas y desglose por rol.

### 11.4 Servicio de Push (`server/src/services/pushService.js`)
- `sendPushToUser(userId, payload)`: Envía notificación web a todas las suscripciones activas de un usuario.
- `sendPushToRole(role, payload)`: Envía a todos los usuarios de un rol (usado en campañas).
- Se utiliza en múltiples flujos de negocio: depósitos, transferencias recibidas, ventas, cambios de estado de órdenes, créditos aprobados/rechazados, campañas.

---

## 12. MÓDULO DE REPORTES FINANCIEROS (`/api/reports`)

Exclusivo para superadmin. Genera un dashboard financiero consolidado de toda la plataforma.

### 12.1 Reporte Financiero Consolidado (`GET /api/reports/financial`)
Filtros: `startDate`, `endDate`, `type`, `status`, `search`, `page`, `limit`.

#### Balance General
- `totalIncome`: Suma de transacciones tipo `deposit`, `sale`, `transfer_in`, `income`, `credit`.
- `totalExpenses`: Suma de transacciones tipo `withdrawal`, `purchase`, `transfer_out`, `expense`, `fee`.
- `totalCommissions`: Suma de transacciones tipo `commission`.
- `netBalance`: `totalIncome - totalExpenses - totalCommissions`.
- `pendingAmounts`: Suma de transacciones con `status: pending`.

#### Desglose por Tipo
- Objeto dinámico con cada tipo de transacción y su `count` + `total` acumulado.

#### Tendencia Diaria
- Mapa de ingresos vs egresos por día en el rango de fechas.

#### Resumen de Órdenes
- `totalOrders`, `totalSales`, `totalCommissions`, `totalSellerEarnings`.
- Desglose por `status` de orden.

#### Resumen de Retiros
- `totalRequests`, `totalAmount`, `approved`, `approvedAmount`, `pending`, `pendingAmount`, `rejected`, `rejectedAmount`.

#### Transacciones Paginadas
- Lista paginada de transacciones con datos de usuario y balance de wallet al momento.

### 12.2 Exportación CSV (`GET /api/reports/financial/export`)
- Aplica los mismos filtros.
- Genera CSV con BOM UTF-8 para compatibilidad con Excel.
- Columnas: Fecha, Tipo, Usuario, Email, Descripción, Monto, Estado, Referencia.
- Devuelve como `attachment` con nombre dinámico `reporte-financiero-{fecha}.csv`.

---

## 13. MÓDULO DE FINANZAS PERSONALES (`/api/finances`)

Este módulo es la herramienta de contabilidad personal dentro de Ingenio Millonario (aunque técnicamente cualquier usuario autenticado puede acceder a consultas básicas). Permite llevar un control detallado de ingresos, gastos, activos, pasivos, presupuestos y metas de ahorro.

### 13.1 Registros Financieros
- **`GET /api/finances`**: Lista movimientos del usuario con múltiples filtros:
  - `month` + `year`: filtra por mes completo.
  - `startDate` + `endDate`: rango personalizado.
  - `type`: `income`, `expense`, `asset`, `liability`.
  - `query`: búsqueda en `description` y `notes`.
- **`POST /api/finances`** (requiere `requireActiveSubscription`): Crea registro financiero.
  - Si no se envía `categoryId`, busca o crea automáticamente una categoría "General" del tipo correspondiente.
- **`DELETE /api/finances/:id`** (requiere suscripción): Elimina registro propio.

### 13.2 Resumen Financiero
- **`GET /api/finances/summary`**: Dashboard financiero personal:
  - **Patrimonio Neto (Net Worth)**: calculado con TODOS los registros históricos (`assets - liabilities`).
  - **Ingresos y Gastos del mes**.
  - **Crecimiento del patrimonio vs mes anterior**.
  - **Tasa de ahorro**: `(income - expenses) / income * 100`.

### 13.3 Categorías
- **`GET /api/finances/categories?type=`**: Lista categorías del usuario.
- **`POST /api/finances/categories`** (requiere suscripción): Crea categoría con `name`, `type`, `color`, `icon`.

### 13.4 Presupuestos (Budget)
- **`GET /api/finances/budget?month=&year=`**: Obtiene presupuesto mensual + cálculo de valores reales (`actuals`) basado en registros financieros del período.
- **`POST /api/finances/budget`** (requiere suscripción): Upsert de presupuesto con `incomeGoal`, `expenseLimit`, `durationMonths`, `startDate`, `categoryLimits`.

### 13.5 Metas de Ahorro/Gasto (Budget Items)
- **`GET /api/finances/budget/items`**: Lista metas personales.
- **`POST /api/finances/budget/items`** (requiere suscripción): Crea meta (`type`, `name`, `description`, `amount`, `durationMonths`).
- **`PUT /api/finances/budget/items/:id`** (requiere suscripción): Edita meta.
- **`DELETE /api/finances/budget/items/:id`** (requiere suscripción): Elimina meta.
- **`POST /api/finances/budget/items/:id/log`**: Registra progreso manual sobre la meta (ej: "ahorré 50.000 esta semana"). Valida que no supere la meta ni quede negativo.
- **`POST /api/finances/budget/items/:id/reactivate`**: Reinicia el ciclo de la meta actualizando `startDate`.

---

## 14. FRONTEND: ARQUITECTURA, RUTAS Y FLUJOS DE USUARIO

### 14.1 Estructura de Rutas (`src/App.tsx`)

La aplicación React usa `react-router-dom` con `BrowserRouter` y un sistema de `ProtectedRoute` basado en roles.

#### Rutas Públicas
- `/` — LandingPage (página de inicio pública)
- `/login` — LoginPage
- `/register` — RegisterPage
- `/tienda/:slug` — StorePage (vista pública de tienda)
- `/producto/:slug` — ProductDetailPage
- `/precios` — PricingPage (precios de Ingenio)
- `/presentacion-e1` — PresentacionE1 (landing de etapa E1)
- `/presentacion-e2` — PresentacionE2 (landing de etapa E2)

#### Rutas de Admin (`/admin`)
Layout: `AdminLayout`. Rol requerido: `superadmin`.
- `/admin` — Dashboard general
- `/admin/tiendas` — Gestión de tiendas
- `/admin/usuarios` — Gestión completa de usuarios
- `/admin/productos` — Gestión global de productos
- `/admin/pedidos` — Gestión de órdenes
- `/admin/finanzas` — Reportes financieros consolidados
- `/admin/transacciones` — Historial global de transacciones
- `/admin/retiros` — Gestión de solicitudes de retiro
- `/admin/creditos` — Aprobación/rechazo de créditos
- `/admin/reportes` — Reportes generales
- `/admin/ingenio` — Dashboard de Ingenio Millonario
- `/admin/ingenio/materiales` — Gestión de materiales descargables
- `/admin/ingenio/suscripciones` — Gestión de suscripciones de Ingenio
- `/admin/campanas` — Campañas de notificaciones push
- `/admin/planes` — Planes de suscripción para vendedores
- `/admin/configuracion` — Ajustes generales de la plataforma
- `/admin/perfil` — Perfil del admin

#### Rutas de Vendedor (`/vendedor`)
Layout: `SellerLayout`. Rol requerido: `seller`.
- `/vendedor` — Dashboard del vendedor
- `/vendedor/tienda` — Configuración de mi tienda
- `/vendedor/productos` — Gestión de productos
- `/vendedor/pedidos` — Órdenes recibidas
- `/vendedor/ventas` — Historial de ventas
- `/vendedor/pos` — Punto de Venta (POS)
- `/vendedor/retiros` — Solicitudes de retiro
- `/vendedor/reportes` — Reportes de mi tienda
- `/vendedor/proveedores` — Gestión de proveedores
- `/vendedor/clientes` — Base de clientes locales
- `/vendedor/compras` — Compras a proveedores
- `/vendedor/gestion` — Gestión general
- `/vendedor/perfil` — Perfil del vendedor
- `/vendedor/configuracion` — Configuración
- `/vendedor/notificaciones` — Notificaciones

#### Rutas de Cliente (`/app`)
Layout: `ClientLayout`. Roles permitidos: `client`, `seller`, `superadmin`.
- `/app` — Home del cliente (dashboard personal)
- `/app/tiendas` — Directorio de tiendas
- `/app/tienda/:slug` — Vista de tienda
- `/app/producto/:id` — Detalle de producto
- `/app/carrito` — Carrito de compras
- `/app/checkout` — Proceso de pago
- `/app/escanear` — Escáner de QR (para pagar con tarjeta virtual)
- `/app/wallet` — Mi billetera
- `/app/wallet/transferir` — Transferir dinero a otro usuario
- `/app/tarjeta` — Mi tarjeta virtual QR
- `/app/pedidos` — Mis compras
- `/app/pedidos/:id` — Detalle de orden
- `/app/perfil` — Mi perfil
- `/app/creditos` — Mis créditos
- `/app/ingenio` — Landing de Ingenio Millonario (para clientes que aún no son estudiantes)
- `/app/ingenio/estudiar` — Estudio de Ingenio (si tiene acceso)
- `/app/cursos` — Catálogo de cursos
- `/app/cursos/:id` — Detalle de curso
- `/app/notificaciones` — Centro de notificaciones

#### Rutas de Ingenio Millonario (`/ingenio`)
Layout: `IngenioLayout`. Rol requerido: `ingenio`.
- `/ingenio` — Dashboard del estudiante Ingenio
- `/ingenio/presupuesto` — Gestión financiera personal (presupuestos, metas, registros)
- `/ingenio/reportes` — Reportes de progreso financiero
- `/ingenio/academia` — Academia (cursos E1/E2)
- `/ingenio/materiales` — Materiales descargables
- `/ingenio/cursos/:id` — Detalle de curso dentro de Ingenio
- `/ingenio/wallet` — Wallet desde vista Ingenio
- `/ingenio/profile` — Perfil de estudiante Ingenio

### 14.2 Layouts Específicos

#### `IngenioLayout.tsx`
- Posee su propia barra de navegación lateral con branding de Ingenio Millonario.
- Incluye lógica de verificación de suscripción activa.
- Si el usuario no tiene suscripción activa, muestra modal de suscripción o redirige a landing de precios.

#### `ClientLayout.tsx`
- Navegación inferior tipo app móvil con iconos: Inicio, Tiendas, Cursos, Wallet, Perfil.
- Header con notificaciones y saludo personalizado.
- Integra `GlobalPaywall` para mostrar upsells de Ingenio.

#### `AdminLayout.tsx`
- Sidebar de administración completa con iconos y submenús.
- Acceso rápido a todas las áreas de gestión.

#### `SellerLayout.tsx`
- Dashboard comercial con métricas de ventas, productos y pedidos.
- Acceso a herramientas de gestión de inventario y POS.

### 14.3 Stores de Estado Global (Zustand)

#### `authStore.ts`
- Estado: `user`, `isAuthenticated`, `token`, `isLoading`, `error`, `interfaceMode`.
- Persistencia: `localStorage` (clave `oscorp-auth`). Persiste `user`, `isAuthenticated`, `interfaceMode`.
- Acciones:
  - `login(email, password)` → guarda token en `oscorp-token`, actualiza estado.
  - `register(data)` → similar a login.
  - `logout()` → limpia token y estado.
  - `fetchCurrentUser()` → recupera sesión al cargar la app. Si el token expiró, redirige a `/login`.
  - `updateUser(data)` → actualiza perfil vía API.
  - `updateBankData(data)` → actualiza datos bancarios.
  - `addRole(role)` → agrega rol dinámicamente y refresca token.
  - `hasRole(roles)` → helper booleano.

#### `paywallStore.ts`
- Estado simple: `isOpen`.
- Controla la visualización del modal de suscripción/pago de Ingenio Millonario (`GlobalPaywall`).

### 14.4 Componentes Clave de Ingenio Millonario

#### `GlobalPaywall.tsx`
- Componente montado a nivel de `App.tsx` (siempre presente).
- Detecta cuando una ruta o acción requiere suscripción de Ingenio.
- Abre `SubscriptionModal` cuando el usuario intenta acceder a funciones protegidas.

#### `SubscriptionModal.tsx`
- Modal completo de suscripción.
- Muestra precio configurado, opciones de cuotas (1 a `maxInstallments`).
- Permite seleccionar método de pago: Wallet o Transferencia Bancaria.
- Si elige Wallet, verifica saldo y procesa pago inmediato.
- Si elige Transferencia, muestra instrucciones bancarias y envía solicitud a admin.
- Gestiona estados de carga, éxito y error.

#### `Wheel.tsx`
- Visualización animada de la ruleta de 10 segmentos de una etapa.
- Cada segmento tiene color, icono y título.
- Permite seleccionar un principio y mostrar su descripción detallada.
- Integrada en `IngenioDashboard` y páginas de estudio.

#### `AccessDenied.tsx`
- Pantalla de bloqueo cuando un usuario ingenio intenta acceder sin suscripción activa.
- Incluye CTA para suscribirse o contactar soporte.

#### `SecureViewer.tsx`
- Visor seguro de documentos PDF.
- Previene descargas directas dependiendo del contexto.
- Usado para materiales de Ingenio.

#### `FilePicker.tsx`
- Selector de archivos reutilizable con drag & drop.
- Integrado con `uploadApi` para subir a `/api/upload`.

### 14.5 Cliente API (`src/lib/api.ts`)

Un cliente API centralizado y modular con `fetch` nativo.

#### Mecánica Base (`fetchWithAuth`)
- Lee token de `localStorage.getItem('oscorp-token')`.
- Inyecta header `Authorization: Bearer <token>`.
- Base URL: `/api`.
- Manejo de errores unificado: parsea JSON de error y lanza `Error(error.details || error.error || HTTP status)`.

#### APIs Disponibles (objetos exportados)
- `authApi`: login, register, getMe, updateMe, changePassword, addRole.
- `usersApi`: getAll, getById, updateStatus, delete, sellerProfile, bankData, search, update, preferences, ingenioAccess, assignCourse, upgradeToClient.
- `productsApi`: getAll, getFeatured, getById, create, update, delete.
- `ordersApi`: getAll, getById, create, updateStatus.
- `walletApi`: getWallet, getTransactions, deposit, transfer, pinStatus, setPin, changePin, getCard, updateCardDesign, withdraw, getAllTransactions.
- `creditsApi`: getAll, getById, create, approve, reject, cancel, update, remove, payInstallment, uploadDocuments, getAllAdmin.
- `notificationsApi`: getAll, markAsRead, markAllAsRead, sendBroadcast, trackClick.
- `campaignsApi`: getAll, create, update, delete, send.
- `pushApi`: getStats, getStatus.
- `suppliersApi`, `customersApi`, `purchasesApi`, `managementApi`.
- `coursesApi`: CRUD completo de cursos, módulos, lecciones, recursos, enrollments, progress.
- `settingsApi`: get, update, init.
- `financesApi`: registros, categorías, budget, budget items, log progreso.
- `reportsApi`: getFinancial, exportCSV.
- `storesApi`: getAll, getBySlug.
- `ingenioApi`: setup, stats, stages, segments, students, assignments, subscriptions, materials, public wheel.
- `uploadApi`: uploadFile.

---

## 15. UPLOADS Y MANEJO DE ARCHIVOS

### 15.1 Subida General (`/api/upload`)
- **`POST /api/upload`**: Requiere autenticación. Usa Multer con `single('file')`.
- **Almacenamiento**:
  - Desarrollo: `server/uploads/`
  - Producción (Vercel): `os.tmpdir() + '/uploads'`
- **Límite**: 20MB por archivo.
- **Nombre de archivo**: Sanitizado (reemplaza caracteres especiales por `_`) + prefijo único (`Date.now()-random`).
- **Respuesta**: `{ url: "/api/uploads/filename", filename, size, mimetype }`.
- **Servicio estático**: Express sirve `/api/uploads` estáticamente desde el directorio correspondiente.

### 15.2 Subida de Documentos de Crédito
- Ruta separada en `/api/credits/:id/documents`.
- Multer configurado para máximo 4 archivos, 5MB cada uno.
- Filtro de imágenes: JPEG, PNG, WebP, HEIC, HEIF.
- Guarda en `uploads/documents/`.

---

## 16. SEGURIDAD: ANÁLISIS DETALLADO

| Capa | Implementación |
|------|----------------|
| **Autenticación** | JWT firmado con secreto (`JWT_SECRET`). Payload: `userId`, `email`, `roles`. Expiración configurable (`JWT_EXPIRES_IN`). |
| **Hash de passwords** | `bcryptjs` con salt rounds 10. |
| **Hash de PIN** | `bcryptjs` con salt rounds 10 para el `transactionPin` de wallet. |
| **Protección de rutas API** | Middleware `authenticate` verifica JWT. Middleware `authorize` verifica roles. Middleware `requireActiveSubscription` verifica acceso a Ingenio. |
| **Anti-enumeración** | Login retorna mensaje genérico idéntico para email inexistente y password incorrecta. |
| **Verificación de email** | Registro bloquea login hasta verificar (`isVerified`). Token criptográfico de 32 bytes con expiración de 24h. |
| **Validación de inputs** | Regex de email, regex de password (8 chars, 1 letra, 1 número), regex de slug de tienda, validación de SKU único. |
| **Transacciones atómicas** | Todas las operaciones financieras críticas usan `prisma.$transaction` para garantizar consistencia. |
| **Sanitización** | Filenames de uploads sanitizados. |
| **CORS** | Configurado explícitamente al `FRONTEND_URL` con `credentials: true`. |

### Notas de Seguridad Observadas
- El sistema usa `localStorage` para almacenar el JWT. Esto lo hace vulnerable a XSS si se inyecta código malicioso. No se observa uso de `HttpOnly` cookies.
- No existe rate limiting en los endpoints de login/register, lo que lo hace teóricamente vulnerable a fuerza bruta (aunque el delay de bcrypt mitiga parcialmente).
- No hay soft deletes en la mayoría de modelos; las eliminaciones son físicas con cascade.

---

## 17. SETUP Y SEMILLADO DE DATOS

### 17.1 Endpoint de Setup (`GET /api/setup`)
- Crea/actualiza 5 usuarios de prueba con password hasheada `123456`:
  - **Admin**: `admin@oscorp.com` (roles: `superadmin`, wallet con 10,000)
  - **Seller 1**: `seller1@oscorp.com` (roles: `seller`, wallet 2,500, SellerProfile "Tech Store Pro")
  - **Seller 2**: `seller2@oscorp.com` (roles: `seller`, wallet 1,800, SellerProfile "Fashion Trends")
  - **Client 1**: `client1@oscorp.com` (roles: `client`, wallet 500, `ingenioAccess: true`)
  - **Client 2**: `client2@oscorp.com` (roles: `client`, wallet 150)
- Cada usuario tiene `VirtualCard` generada automáticamente.
- Ideal para demos y desarrollo.

### 17.2 Seed de Prisma
- `prisma/seed.ts`: Seed completo con cursos, productos, transacciones, categorías financieras, notificaciones. **Nota**: contiene discrepancias con el schema actual (usa `role` singular en lugar de `roles` array).
- `prisma/test-seed.ts`: Seed mínimo para tests. Usa moneda `PYG` (Guaraní paraguayo), indicando que el mercado objetivo de producción es Paraguay.

---

## 18. MAPA COMPLETO DE ENDPOINTS API

A continuación, el mapa exhaustivo de todos los endpoints disponibles en el backend:

### Auth (`/api/auth`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/login` | Login con email/password | Público |
| POST | `/register` | Registro con verificación de email | Público |
| GET | `/me` | Usuario actual | ✅ |
| PUT | `/me` | Actualizar perfil | ✅ |
| PUT | `/me/password` | Cambiar contraseña | ✅ |
| GET | `/verify?token=` | Verificar email | Público |
| POST | `/add-role` | Agregar rol al usuario | ✅ |

### Users (`/api/users`)
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/` | Listar todos los usuarios | superadmin |
| GET | `/search?query=` | Buscar usuarios | ✅ |
| PUT | `/profile` | Actualizar perfil propio | ✅ |
| PUT | `/change-password` | Cambiar contraseña | ✅ |
| PUT | `/seller-profile` | Actualizar perfil de vendedor | seller |
| PUT | `/:id/seller-profile` | Editar perfil de vendedor | superadmin |
| GET | `/:id` | Ver usuario por ID | admin/owner |
| PATCH | `/:id/status` | Activar/desactivar usuario | superadmin |
| PUT | `/:id` | Editar usuario completo | superadmin |
| DELETE | `/:id` | Eliminar usuario | superadmin |
| PATCH | `/:id/ingenio` | Conceder/revocar acceso Ingenio | superadmin |
| PUT | `/me/bank-data` | Actualizar datos bancarios | ✅ |
| GET | `/me/preferences` | Preferencias de notificación | ✅ |
| PUT | `/me/preferences` | Guardar preferencias | ✅ |
| POST | `/:id/courses/:courseId` | Asignar curso a usuario | superadmin |
| DELETE | `/:id/courses/:courseId` | Revocar acceso a curso | superadmin |
| POST | `/upgrade-to-client` | Agregar rol client y crear wallet | ✅ |

### Products (`/api/products`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Listar productos | Público |
| GET | `/featured` | Productos destacados | Público |
| GET | `/:id` | Detalle de producto | Público |
| POST | `/` | Crear producto | seller/admin |
| PUT | `/:id` | Actualizar producto | owner/admin |
| DELETE | `/:id` | Eliminar producto | owner/admin |

### Orders (`/api/orders`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/?as=` | Listar órdenes | ✅ |
| GET | `/:id` | Detalle de orden | owner/admin |
| POST | `/` | Crear orden | ✅ |
| PATCH | `/:id/status` | Actualizar estado | seller/admin |

### Wallet (`/api/wallet`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/all-transactions` | Todas las transacciones (admin) | superadmin |
| GET | `/` | Mi wallet | ✅ |
| GET | `/transactions` | Historial paginado | ✅ |
| POST | `/deposit` | Depositar dinero | ✅ |
| GET | `/pin-status` | ¿Tiene PIN? | ✅ |
| POST | `/pin/set` | Configurar PIN | ✅ |
| POST | `/pin/change` | Cambiar PIN | ✅ |
| POST | `/transfer` | Transferir a otro usuario | ✅ |
| POST | `/withdraw` | Solicitar retiro | ✅ |
| GET | `/card` | Mi tarjeta virtual | ✅ |
| PATCH | `/card/design` | Cambiar diseño de tarjeta | ✅ |

### Credits (`/api/credits`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Mis créditos | ✅ |
| GET | `/admin/all` | Todos los créditos | superadmin |
| GET | `/:id` | Detalle de crédito | owner/admin |
| POST | `/` | Solicitar crédito | ✅ |
| PATCH | `/:id/approve` | Aprobar crédito | superadmin |
| PATCH | `/:id/reject` | Rechazar crédito | superadmin |
| PATCH | `/:id/cancel` | Cancelar crédito pendiente | owner |
| PUT | `/:id` | Editar crédito pendiente | owner |
| DELETE | `/:id` | Eliminar crédito pendiente | owner |
| POST | `/:id/pay` | Pagar cuota | owner |
| POST | `/:id/documents` | Subir documentos | owner |

### Courses (`/api/courses`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/?all=` | Listar cursos | Público |
| GET | `/slug/:slug` | Curso por slug | Público |
| GET | `/my/enrollments` | Mis cursos | ✅ |
| GET | `/:id` | Detalle de curso | Público |
| POST | `/` | Crear curso | superadmin |
| PUT | `/:id` | Actualizar curso | superadmin |
| PATCH | `/:id` | Actualizar curso (parcial) | superadmin |
| DELETE | `/:id` | Eliminar curso | superadmin |
| POST | `/:id/modules` | Agregar módulo | superadmin |
| PUT | `/modules/:moduleId` | Editar módulo | superadmin |
| DELETE | `/modules/:moduleId` | Eliminar módulo | superadmin |
| POST | `/modules/:moduleId/lessons` | Agregar lección | superadmin |
| PUT | `/lessons/:lessonId` | Editar lección | superadmin |
| DELETE | `/lessons/:lessonId` | Eliminar lección | superadmin |
| POST | `/resources` | Agregar recurso | superadmin |
| DELETE | `/resources/:resourceId` | Eliminar recurso | superadmin |
| GET | `/:id/access` | Estudiantes inscritos | superadmin |
| POST | `/:id/assign` | Asignar usuario a curso | superadmin |
| DELETE | `/:id/access/:accessId` | Revocar acceso | superadmin |
| POST | `/:id/enroll` | Auto-inscribirse | ✅ |
| POST | `/:id/request` | Solicitar acceso a curso | ✅ |
| PATCH | `/access/:accessId/progress` | Actualizar progreso | ✅ |

### Ingenio (`/api/ingenio`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/setup` | Inicializar sistema Ingenio | superadmin |
| GET | `/stats` | Estadísticas del programa | superadmin |
| GET | `/stages` | Listar etapas | Público/✅ |
| POST | `/stages` | Crear etapa | superadmin |
| PUT | `/stages/:id` | Editar etapa | superadmin |
| DELETE | `/stages/:id` | Eliminar etapa | superadmin |
| GET | `/segments/:stageId` | Segmentos de etapa | Público/✅ |
| POST | `/segments` | Crear segmento | superadmin |
| PUT | `/segments/:id` | Editar segmento | superadmin |
| DELETE | `/segments/:id` | Eliminar segmento | superadmin |
| GET | `/contents/:stageId` | Contenidos de etapa | Público/✅ |
| POST | `/contents` | Crear contenido | superadmin |
| PUT | `/contents/:id` | Editar contenido | superadmin |
| DELETE | `/contents/:id` | Eliminar contenido | superadmin |
| GET | `/materials?stage=` | Materiales descargables | Público/✅ |
| POST | `/materials` | Crear material | superadmin |
| PUT | `/materials/:id` | Editar material | superadmin |
| DELETE | `/materials/:id` | Eliminar material | superadmin |
| GET | `/students` | Listar estudiantes | superadmin |
| GET | `/students/me` | Mi perfil de estudiante | ✅ |
| POST | `/students/register` | Registrarme como estudiante | ✅ |
| PUT | `/students/me` | Actualizar perfil estudiante | ✅ + suscripción |
| GET | `/assignments/me` | Mis asignaciones | ✅ |
| POST | `/assignments` | Asignar etapa a estudiante | superadmin |
| POST | `/assignments/:id/start` | Iniciar asignación | ✅ + suscripción |
| PUT | `/assignments/:id/progress` | Actualizar progreso | ✅ + suscripción |
| GET | `/config` | Config de precios Ingenio | ✅ |
| GET | `/subscription/me` | Mi suscripción Ingenio | ✅ |
| POST | `/subscribe` | Suscribirse / pagar cuota | ✅ |
| GET | `/admin/subscriptions` | Todas las suscripciones | superadmin |
| PUT | `/admin/subscriptions/:id/approve` | Aprobar suscripción | superadmin |
| PUT | `/admin/subscriptions/:id/revoke` | Revocar suscripción | superadmin |
| DELETE | `/admin/subscriptions/:id` | Eliminar suscripción | superadmin |

### Finances (`/api/finances`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Registros financieros | ✅ |
| GET | `/summary` | Resumen financiero | ✅ |
| POST | `/` | Crear registro | ✅ + suscripción |
| DELETE | `/:id` | Eliminar registro | ✅ + suscripción |
| GET | `/categories` | Categorías | ✅ |
| POST | `/categories` | Crear categoría | ✅ + suscripción |
| GET | `/budget` | Presupuesto mensual | ✅ |
| POST | `/budget` | Crear/editar presupuesto | ✅ + suscripción |
| GET | `/budget/items` | Metas de ahorro/gasto | ✅ |
| POST | `/budget/items` | Crear meta | ✅ + suscripción |
| PUT | `/budget/items/:id` | Editar meta | ✅ + suscripción |
| POST | `/budget/items/:id/log` | Lograr progreso | ✅ |
| POST | `/budget/items/:id/reactivate` | Reactivar meta | ✅ |
| DELETE | `/budget/items/:id` | Eliminar meta | ✅ + suscripción |

### Notifications (`/api/notifications`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Mis notificaciones | ✅ |
| PATCH | `/read-all` | Marcar todas leídas | ✅ |
| PATCH | `/:id/read` | Marcar leída | ✅ |
| PATCH | `/:id/click` | Registrar click | ✅ |
| POST | `/broadcast` | Enviar masivo | superadmin |

### Campaigns (`/api/campaigns`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/` | Listar campañas | superadmin |
| POST | `/` | Crear campaña | superadmin |
| PUT | `/:id` | Editar campaña | superadmin |
| DELETE | `/:id` | Eliminar campaña | superadmin |
| POST | `/:id/send` | Enviar campaña draft | superadmin |

### Push (`/api/push`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/vapid-public-key` | Clave pública VAPID | Público |
| POST | `/subscribe` | Suscribir navegador | ✅ |
| POST | `/unsubscribe` | Desuscribir navegador | ✅ |
| GET | `/status` | Estado de suscripción | ✅ |
| GET | `/stats` | Estadísticas push | superadmin |

### Reports (`/api/reports`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/financial` | Reporte financiero consolidado | superadmin |
| GET | `/financial/export` | Exportar CSV | superadmin |

### Upload (`/api/upload`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/` | Subir archivo | ✅ |

### Health Checks
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Estado del servidor |
| GET | `/api/health/db` | Estado de la base de datos + conteo de usuarios |

---

## 19. FLUJOS DE NEGOCIO CLAVE (RESUMEN VISUAL)

### Flujo 1: Registro y Onboarding
```
Usuario → /register → Valida datos → Hash password → Genera token verificación
→ Crea Wallet + VirtualCard → Crea SellerProfile (si aplica)
→ Envía email de verificación (o demoToken)
→ Auto-login con JWT
```

### Flujo 2: Compra en Marketplace
```
Cliente agrega productos al carrito → /checkout
→ Calcula totales y comisión 5% → Valida saldo wallet (si paga wallet)
→ Transacción atómica: crea Order, transfiere fondos, decrementa stock
→ Notificación Push al comprador y vendedor
→ Tracking de estado de orden
```

### Flujo 3: Suscripción a Ingenio Millonario
```
Usuario en /ingenio o /app/ingenio → Abre SubscriptionModal
→ Elige cuotas (1-3) y método (Wallet / Transferencia)
→ Si Wallet: valida saldo, descuenta, crea transacción expense
  → Suscripción queda ACTIVE si estaba revocado, o PENDING_APPROVAL si es nueva
→ Si Transferencia: queda PENDING_APPROVAL
→ Admin recibe solicitud → /admin/ingenio/suscripciones
→ Admin aprueba ingresando monto recibido → Usuario obtiene ingenioAccess: true
```

### Flujo 4: Solicitud y Aprobación de Crédito
```
Cliente solicita crédito en /app/creditos → POST /credits
→ Genera tabla de amortización → Estado: pending
→ Sube documentos (opcional)
→ Admin revisa en /admin/creditos
→ Admin aprueba: estado active, acredita monto a wallet, envía push
→ Cliente paga cuotas desde wallet → POST /credits/:id/pay
→ Si todas las cuotas pagadas → estado completed
```

### Flujo 5: E-Learning
```
Usuario ve catálogo en /app/cursos o /ingenio/academia
→ Enroll gratis (si tiene acceso Ingenio) o pago con wallet
→ Accede a módulos y lecciones
→ Marca lecciones como completadas
→ Sistema recalcula progreso % automáticamente
→ Si 100% → curso completado, opcional certificado
```

---

## 20. HALLAZGOS TÉCNICOS Y OBSERVACIONES

1. **Moneda dual**: El schema defaultea `USD` pero el seed de tests y la interfaz de wallet usan `PYG` (Guaraníes paraguayos), indicando que el target de producción es Paraguay.
2. **Discrepancia seed/schema**: `prisma/seed.ts` usa `role` (singular) cuando el schema define `roles` (array). Esto causará errores si se ejecuta el seed completo sin corrección.
3. **JWT en localStorage**: Aunque funcional, es menos seguro contra XSS que cookies HttpOnly.
4. **No hay rate limiting**: Los endpoints de auth no tienen protección contra fuerza bruta.
5. **No hay soft deletes**: La mayoría de las eliminaciones son físicas. Considerar `deletedAt` para auditoría.
6. **Duplicación SellerProfile/Store**: Ambos modelos comparten muchos campos. Requiere sincronización cuidadosa.
7. **Campos JSON sin tipado estricto**: `permissions`, `notificationPrefs`, `businessHours`, `socialLinks`, `metadata`, `deliveryAddress` ofrecen flexibilidad pero requieren validación en la capa de aplicación.

---

## 21. CONCLUSIÓN

**Oscorp Platform** es un ecosistema digital **muy completo**, que va mucho más allá de un simple e-commerce. Integra:
- **Marketplace multi-vendedor** con inventario, POS, proveedores y clientes locales.
- **Fintech** con billetera P2P, tarjeta QR, depósitos, retiros, PIN de seguridad y créditos con amortización.
- **E-learning** con cursos estructurados en módulos y lecciones, seguimiento de progreso y certificados.
- **Programa Premium "Ingenio Millonario"** con suscripción, ruleta pedagógica de 10 principios, etapas E1/E2, materiales descargables, sistema de referidos y contabilidad personal.
- **Marketing** con campañas masivas, notificaciones push y reportes financieros consolidados con exportación CSV.

La arquitectura es moderna (React 19, Vite, Express, Prisma, PostgreSQL) y el código está bien organizado en capas. El sistema está diseñado para escalar horizontalmente en Vercel con PostgreSQL serverless (Neon).

---

*Documento generado a partir de análisis quirúrgico del código fuente completo de Oscorp Platform.*
