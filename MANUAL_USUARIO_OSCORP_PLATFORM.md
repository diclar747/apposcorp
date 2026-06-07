# MANUAL DE USUARIO — OSCORP PLATFORM
## Guía Completa Paso a Paso de Cada Módulo y Función del Sistema

---

## TABLA DE CONTENIDOS

1. [Introducción al Sistema](#1-introducción-al-sistema)
2. [Primer Acceso: Registro e Inicio de Sesión](#2-primer-acceso-registro-e-inicio-de-sesión)
3. [Módulo Cliente / Usuario](#3-módulo-cliente--usuario)
4. [Módulo Vendedor / Comerciante](#4-módulo-vendedor--comerciante)
5. [Módulo Ingenio Millonario](#5-módulo-ingenio-millonario)
6. [Módulo Administrador](#6-módulo-administrador)
7. [Glosario de Estados y Términos](#7-glosario-de-estados-y-términos)

---

## 1. INTRODUCCIÓN AL SISTEMA

**Oscorp Platform** es un ecosistema digital que combina cuatro funcionalidades principales en una sola aplicación:

- **Billetera Digital (Wallet)**: Envía, recibe y paga con dinero digital.
- **Marketplace / Tienda**: Compra y vende productos y servicios.
- **Créditos**: Solicita préstamos personales con cuotas.
- **Ingenio Millonario**: Programa premium de educación financiera con herramientas de control de gastos.

### Roles de Usuario

Una misma cuenta puede tener uno o más roles. Los roles son:

| Rol | Qué puede hacer |
|-----|-----------------|
| **Usuario / Cliente** | Usar wallet, comprar en tiendas, solicitar créditos, escanear QR. |
| **Comerciante / Vendedor** | Crear tienda, publicar productos, recibir pedidos, usar POS. |
| **Estudiante Ingenio** | Acceder al programa educativo, registrar finanzas personales. |
| **Administrador** | Gestionar usuarios, aprobar créditos, ver reportes globales. |

> **Nota importante**: Al registrarte eliges un rol inicial, pero luego puedes agregar más roles desde tu perfil.

---

## 2. PRIMER ACCESO: REGISTRO E INICIO DE SESIÓN

### 2.1 Crear una Cuenta Nueva

1. En la pantalla de bienvenida, presiona el botón **"Regístrate"**.
2. Se abre un formulario en 3 pasos:

**Paso 1 — Datos Personales:**
- Campo **"Nombre"**: Escribe tu nombre (mínimo 2 letras).
- Campo **"Apellido"**: Escribe tu apellido.
- Campo **"Correo electrónico"**: Ingresa un email válido (será tu usuario).
- Campo **"Teléfono"** (opcional): Número de contacto.
- Campo **"Contraseña"**: Mínimo 8 caracteres, debe incluir al menos 1 letra y 1 número.
- Presiona el botón **"Continuar"** (flecha derecha).

**Paso 2 — Tipo de Cuenta:**
El sistema muestra 3 tarjetas para elegir:
- **"Usuarios"**: Para usar wallet y comprar.
- **"Comerciante"**: Para vender productos y usar POS.
- **"Ingenio Millonario"**: Para el programa de educación financiera.
- Toca la tarjeta que corresponda (se marcará con borde azul y check).
- Presiona **"Continuar"**.

**Paso 3 — Confirmación:**
- Revisa tus datos en pantalla.
- Presiona el botón **"Crear cuenta"**.
- El sistema enviará un email de verificación (o mostrará un token en modo demo).

**Verificación de email:**
- Revisa tu bandeja de entrada o spam.
- Presiona el botón **"Verificar mi cuenta"** del email.
- O copia el token y pégalo en la pantalla de login.

> **Importante**: No puedes iniciar sesión hasta verificar tu email. Si intentas loguearte sin verificar, verás el mensaje de error correspondiente.

### 2.2 Iniciar Sesión

1. En la pantalla de inicio, presiona **"Inicia sesión"**.
2. Completa:
   - **Correo electrónico**
   - **Contraseña**
3. Opcional: Marca la casilla **"Recordarme"** para mantener la sesión.
4. Presiona el botón **"Iniciar Sesión"** (fondo azul-morado degradado).

**¿Olvidaste tu contraseña?**
- Toca el enlace **"¿Olvidaste tu contraseña?"** debajo del botón de login.
- Sigue el proceso de recuperación por email.

**Acceso rápido (demo):**
En la pantalla de login existen 4 botones de acceso rápido para pruebas:
- **Admin** (escudo morado)
- **Comerciante** (tienda verde)
- **Usuarios** (persona azul)
- **Ingenio Millonario** (libro índigo)

### 2.3 Cerrar Sesión

1. Ve a **Perfil** (icono de persona en la navegación inferior).
2. Desplázate hasta el final.
3. Presiona el botón rojo **"CERRAR SESIÓN"**.
4. Confirmación automática: aparece mensaje "Sesión cerrada".

---

## 3. MÓDULO CLIENTE / USUARIO

Cuando inicias sesión como cliente, el sistema te lleva al **Home** (`/app`). La navegación inferior tiene 5 iconos: **Inicio**, **Tiendas**, **Cursos**, **Wallet**, **Perfil**.

---

### 3.1 Dashboard / Home del Cliente

Al entrar a `/app` ves:

**Saludo personalizado:**
- Texto pequeño: "Bienvenido,"
- Texto grande con tu nombre.

**Tarjeta Virtual:**
- Muestra tu saldo actual, número de tarjeta OSC, nombre del titular, fecha de vencimiento (12/28) y código QR.
- El QR es escaneable para que otros usuarios te paguen.

**Acciones Rápidas (Quick Actions):**
- 4 botones circulares debajo de la tarjeta:
  - **Enviar** (flecha arriba-derecha azul): Para transferir dinero.
  - **Recibir** (flecha abajo-izquierda verde): Te lleva a tu tarjeta QR.
  - **Préstamos** (tarjeta morada): Te lleva a créditos.
  - **Cargar** (QR naranja): Te lleva al escáner para pagar.

**Movimientos Recientes:**
- Lista de últimas 5 transacciones con flecha verde (ingreso) o roja (egreso).
- Presiona **"Ver todo"** (botón ghost azul arriba a la derecha) para ir a la billetera completa.

**Gráfico de Estadísticas:**
- Muestra ingresos vs egresos de los últimos 6 meses.

**Productos Destacados:**
- Grid de 4 productos con imagen, categoría, nombre, precio y botón de carrito.
- Toca el producto para ver detalles.
- Toca el botón del carrito para agregar al carrito (se marca con check verde si ya está).
- Presiona **"Explorar"** para ir al directorio de tiendas.

---

### 3.2 Billetera Digital (Wallet)

Acceso: Navegación inferior → icono **Wallet**, o desde Home presionando "Ver todo" en movimientos.

URL: `/app/wallet`

**Encabezado:**
- Título: "Billetera"
- Subtítulo: "Oscorp Premium Digital"
- Botón de ojo (esquina superior derecha): Oculta/muestra tu saldo.

**Tarjeta Virtual:**
- Igual que en Home. Muestra saldo, número OSC, titular y QR.

**Estadísticas Rápidas:**
- Dos tarjetas:
  - **Ingresos** (verde): Suma de todo lo recibido.
  - **Egresos** (rojo): Suma de todo lo enviado.

**Acciones Rápidas:**
- 4 botones:
  1. **Enviar** → `/app/wallet/transferir`
  2. **Recibir** → `/app/tarjeta`
  3. **Préstamos** → `/app/creditos`
  4. **Cargar** → `/app/escanear`

**Gráfico de Estadísticas:**
- Área chart de tus movimientos mensuales.

**Lista de Movimientos:**
- Filtros en la parte superior: **Todo**, **Ingresos**, **Gastos**.
- Cada movimiento muestra:
  - Icono circular verde (entrada) o rojo (salida).
  - Descripción del movimiento.
  - Fecha y hora.
  - Monto con signo + o -.
  - Flecha derecha (indica que se puede tocar para ver detalle).

**Botón "Historial completo":**
- Te mantiene en la misma pantalla pero muestra más transacciones.

**Botón "Mi Tarjeta QR":**
- Tarjeta grande con icono de QR morado.
- Te lleva a `/app/tarjeta` para ver tu código QR completo.

---

### 3.3 Transferir Dinero a Otro Usuario

Acceso: Wallet → "Enviar", o URL `/app/wallet/transferir`

El proceso tiene 4 pasos visuales (indicador de progreso arriba):

**Paso 1 — Buscar:**
- Campo de búsqueda con lupa azul: escribe nombre, email o teléfono (mínimo 3 caracteres).
- Aparecen resultados con foto, nombre y email del usuario.
- Toca el usuario destino.

**Paso 2 — Monto:**
- Muestra la foto grande del destinatario y su nombre.
- Campo numérico grande para ingresar el monto en ₲.
- Abajo muestra tu **"Saldo disponible"**.
- Campo opcional **"Mensaje"**: ¿Para qué es el dinero?
- Botón **"SIGUIENTE"** (azul, abajo).

> Si tu saldo es insuficiente, aparece error: "Saldo insuficiente".

**Paso 3 — Confirmar:**
- Tarjeta de confirmación con:
  - Tu avatar ("De: Mí").
  - Icono de rayo azul en el medio.
  - Avatar del destinatario ("Para: [Nombre]").
  - Detalles: Monto, Comisión (Gratis), Motivo.
  - Total destacado en azul grande.
- Botón **"CONFIRMAR Y ENVIAR"** (azul, grande).
- Botón **"VOLVER"** (ghost, debajo).

**PIN de Seguridad:**
- Si nunca configuraste un PIN, aparece diálogo para crear uno de 4 dígitos.
- Si ya lo tienes, pide que ingreses tu PIN actual para confirmar.

**Paso 4 — Éxito:**
- Pantalla completa con check verde animado.
- Texto: "¡Transferencia Exitosa!"
- Detalle: "Has enviado [monto] a [nombre apellido]".
- Dos botones:
  - **"NUEVA TRANSFERENCIA"**: Reinicia el flujo.
  - **"VOLVER AL INICIO"**: Te lleva al wallet.

---

### 3.4 Pagar con QR (Escáner)

Acceso: Wallet → "Cargar", o URL `/app/escanear`

**Pantalla de Escaneo:**
- Muestra la cámara del dispositivo en un recuadro redondeado.
- Apunta al código QR de otro usuario o comercio.
- Al detectar el QR, emite sonido de beep (simulado).

**Confirmación de Pago:**
- Muestra icono de smartphone azul.
- Nombre del receptor.
- Si el QR ya incluye monto: muestra "Total a Pagar" en grande.
- Si el QR no tiene monto: aparece campo para ingresar el monto.
- Texto de seguridad: "Protegido con PIN de seguridad".
- Botón **"CONFIRMAR PAGO"** (azul, grande).
- Botón **"CANCELAR"** (ghost).

**Procesando:**
- Pantalla con spinner azul animado.
- Texto: "Procesando pago..."

**Éxito:**
- Check verde grande animado.
- "¡Pago Exitoso!"
- Detalle del monto y receptor.
- Botón **"VOLVER A LA BILLETERA"**.

---

### 3.5 Mi Tarjeta QR

Acceso: Wallet → "Recibir", o URL `/app/tarjeta`

**Encabezado:**
- Título: "Mi Tarjeta"
- Botón de pantalla completa (esquina superior derecha, icono expandir).

**Tarjeta Virtual:**
- Vista grande de tu tarjeta Oscorp con saldo, número, titular, fecha y QR.

**Acciones Rápidas:**
- 3 botones debajo de la tarjeta:
  1. **"Descargar QR"**: Guarda tu código QR como imagen PNG.
  2. **"Copiar Nro."** / **"Copiado"**: Copia tu número de tarjeta al portapapeles.
  3. **"Pantalla"**: Abre el QR en pantalla completa.

**Detalles de la Tarjeta:**
- Lista con:
  - Número de tarjeta (copiable).
  - Titular.
  - Fecha de vencimiento.
  - Tipo: "Débito Oscorp Premium".

**Información de Seguridad:**
- Tarjeta verde con escudo.
- Texto: "Tu tarjeta está protegida con encriptación de 256 bits."

**Modo Pantalla Completa:**
- Fondo oscuro con QR grande centrado.
- Tu nombre debajo.
- Botón **"Descargar"**.
- Botón **X** (arriba a la derecha) para cerrar.

---

### 3.6 Marketplace — Comprar Productos

#### 3.6.1 Directorio de Tiendas

Acceso: Navegación inferior → "Tiendas", o URL `/app/tiendas`

- Lista de tiendas registradas con logo, nombre, descripción y categoría.
- Toca una tienda para entrar a su catálogo.

#### 3.6.2 Vista de Tienda

URL: `/app/tienda/:slug`

- Banner de la tienda.
- Logo, nombre, badge "Verificada".
- Descripción del negocio.
- Lista de productos en grid.
- Toca un producto para ver detalle.

#### 3.6.3 Detalle de Producto

URL: `/app/producto/:id`

- Imagen grande del producto (carrusel si tiene varias).
- Nombre del producto.
- Precio en grande (azul).
- Precio tachado si tiene oferta.
- Descripción.
- Botón **"Agregar al carrito"** (azul).

#### 3.6.4 Carrito de Compras

Acceso: Navegación inferior → icono de carrito, o URL `/app/carrito`

- Encabezado: "Carrito" + cantidad de productos.
- Botón **"Vaciar"** (texto rojo, arriba a la derecha): Elimina todo.
- Lista de productos agregados:
  - Imagen pequeña.
  - Nombre.
  - Precio total por línea.
  - Controles de cantidad: botón **"-"** (disminuir), número, botón **"+"** (aumentar).
  - Botón **icono basura** (rojo): Elimina ese producto del carrito.
- Barra fija abajo:
  - Subtotal.
  - Envío: "Gratis".
  - Total en grande.
  - Botón **"Continuar"**: Te lleva al checkout.

> Si el carrito está vacío: muestra icono de carrito gris, texto "Tu carrito está vacío" y botón "Explorar tienda".

#### 3.6.5 Checkout (Pagar la Compra)

URL: `/app/checkout`

**Resumen de Productos:**
- Lista cantidad × producto = subtotal por línea.
- Subtotal general.

**Método de Entrega:**
- Dos opciones (radio buttons):
  - **Delivery** (camión): Envío a domicilio.
  - **Retiro en tienda** (map pin): Pasas a buscar.
- Ambos muestran "Gratis".

**Método de Pago:**
- Dos opciones:
  - **Pagar con Wallet**: Usa tu saldo disponible. Muestra debajo tu saldo actual.
  - **Pago contra entrega**: Pagas cuando recibas.

**Barra fija abajo:**
- "Total a pagar" con monto en grande.
- Botón **"Confirmar compra"** (azul, con check).

> Si elegiste Wallet y no tienes saldo suficiente: error "Saldo insuficiente en tu wallet".

#### 3.6.6 Mis Pedidos / Órdenes

Acceso: Perfil → "Mis compras", o URL `/app/pedidos`

- Lista de compras realizadas.
- Cada pedido muestra:
  - Número de orden.
  - Estado (Pendiente, Confirmado, En preparación, Listo, En camino, Entregado).
  - Total pagado.
  - Fecha.
- Toca un pedido para ver detalle completo.

---

### 3.7 Créditos Personales

Acceso: Wallet → "Préstamos", o URL `/app/creditos`

**Encabezado:**
- Título: "Mis Créditos"
- Icono de tendencia morada.

**Botón "Solicitar nuevo crédito":**
- Tarjeta grande con fondo degradado azul-morado.
- Texto: "Solicitar nuevo crédito" / "Financiamiento rápido".
- Toca para abrir el formulario.

**Estadísticas:**
- 3 tarjetas: Activos, Pendientes, Completados.

**Historial de Créditos:**
- Si no tienes créditos: mensaje "No tienes créditos" + botón "Solicitar crédito".
- Cada crédito muestra:
  - Concepto (motivo).
  - Fecha de solicitud.
  - Estado con color:
    - **Pendiente**: ámbar.
    - **Aprobado/Activo**: azul/verde.
    - **Completado**: gris.
    - **Rechazado**: rojo.
    - **Cancelado**: naranja.
  - Monto solicitado.
  - Total a pagar (con intereses).
  - Cantidad de cuotas y monto por cuota.
  - Documentos adjuntos (si subiste).

#### 3.7.1 Solicitar un Nuevo Crédito

**Paso 1 — Datos del Crédito:**
- Campo **"Monto solicitado (₲)"**: Ingresa el número.
- Campo **"Concepto"**: Describe para qué es (ej: "Reparación de vehículo").
- Selector **"Cantidad de cuotas"**: 3, 6, 12, 18 o 24 cuotas.
- Abajo se calcula automático: monto y cuota estimada.
- Botones: **"Cancelar"** / **"Siguiente"**.

**Paso 2 — Documentos de Identidad:**
- Campo **"Cédula - Frente"**: Toca el recuadro para tomar foto o elegir archivo.
- Campo **"Cédula - Dorso"**: Igual que arriba.
- Si ya cargaste una foto, aparece con botón **X** rojo para eliminarla.
- Botones: **"Omitir por ahora"** / **"Enviar solicitud"**.

> Si omites, la solicitud queda pendiente de documentos.

#### 3.7.2 Gestionar Créditos Pendientes

Si tu crédito está **Pendiente**, aparecen 3 botones:
- **"Editar"** (lápiz): Modifica monto, concepto o cuotas.
- **"Cancelar"** (naranja): Cancela la solicitud.
- **"Eliminar"** (basura roja): Borra la solicitud permanentemente.

#### 3.7.3 Pagar Cuotas de un Crédito Activo

Si tu crédito está **Activo**:
- Barra de progreso: cuotas pagadas / cuotas totales.
- Botón **"Pagar cuota - [monto]"** (azul).
- Al tocar, descuenta automáticamente de tu wallet.
- Si pagas todas las cuotas, el crédito pasa a **Completado**.

---

### 3.8 Perfil y Configuración

Acceso: Navegación inferior → "Perfil", o URL `/app/perfil`

**Encabezado:**
- Título: "Mi Perfil"
- Icono de brillo azul.

**Tarjeta de Perfil:**
- Foto circular (o iniciales si no tiene).
- Botón de lápiz azul (abajo-derecha de la foto): Activa modo edición.
- Nombre completo.
- Email.
- Badge "Miembro Premium".

**Modo Edición:**
- Aparece selector de foto de perfil.
- Campos: Nombre, Apellido, Teléfono.
- Botones: **"Cancelar"** / **"Guardar"**.

**Datos de Contacto:**
- Email (azul).
- Teléfono (verde).
- Dirección (morado).

**Mi Tarjeta Oscorp:**
- Vista miniatura de tu tarjeta virtual.

**Menú de Opciones:**
- **"Datos Bancarios"** (tarjeta verde): Abre diálogo para ingresar:
  - Banco.
  - Número de cuenta.
  - Tipo de cuenta (Caja de Ahorro / Cuenta Corriente).
  - Botón **"Guardar Información"**.
- **"Notificaciones Push"**: Interruptor (switch) para activar/desactivar alertas del navegador.
- Otros items: Editar perfil, Seguridad, Ayuda, Términos.

**Cerrar Sesión:**
- Botón rojo al final de la pantalla.

---

## 4. MÓDULO VENDEDOR / COMERCIANTE

Cuando inicias sesión como vendedor, el sistema te lleva al **Dashboard del Vendedor** (`/vendedor`). La navegación es una barra lateral izquierda con iconos.

---

### 4.1 Dashboard del Vendedor

URL: `/vendedor`

**KPIs (tarjetas de resumen):**
- **Ventas**: Total vendido en ₲.
- **Ganancias**: Lo que te queda después de comisiones.
- **Pedidos**: Cantidad de órdenes recibidas.
- **Productos**: Cantidad publicada.

**Gráfico "Ventas de la Semana":**
- Barras verdes con ventas por día (Lun a Dom).

**Pedidos Recientes:**
- Tabla con número de orden, cantidad de productos, total y estado.
- Estados con colores:
  - Verde: Entregado.
  - Amarillo: Pendiente.
  - Otros estados con badge gris.
- Botón **"Ver todos"**: Te lleva a `/vendedor/pedidos`.

---

### 4.2 Configurar Mi Tienda

Acceso: Barra lateral → "Tienda", o URL `/vendedor/tienda`

**Si nunca configuraste tu tienda:**
Aparece pantalla de setup con:
- Título: "Configura tu Tienda"
- Subtítulo: "Tienes 7 días de prueba gratis."
- Formulario:
  - **Nombre de la Tienda** (obligatorio).
  - Email de la tienda.
  - Descripción.
  - Dirección.
  - Teléfono.
  - WhatsApp Business.
  - Logo (subida de imagen circular).
  - Banner (subida de imagen rectangular).
  - Facebook.
  - Instagram.
- Botón **"Crear Mi Tienda"** (azul).

**Si ya tienes tienda:**
- Botón **"Editar Tienda"** (arriba a la derecha).
- Interruptor **"En línea / Offline"**: Activa o desactiva tu tienda pública.
- Banner de la tienda (con botón de cambiar en modo edición).
- Logo (con botón de cambiar).
- Nombre + badge "Verificada".
- Descripción.
- Sección "Información de Contacto":
  - Dirección, Teléfono, Email, WhatsApp.
- Sección "Redes y Enlaces":
  - Facebook (tarjeta azul).
  - Instagram (tarjeta rosa).

**Guardar cambios:**
- En modo edición, botones **"Cancelar"** / **"Guardar"**.

---

### 4.3 Gestión de Productos

Acceso: Barra lateral → "Productos", o URL `/vendedor/productos`

**Encabezado:**
- Título: "Mis Productos"
- Botón **"Nuevo Producto"** (verde, con +): Abre formulario.

**Filtros:**
- Campo de búsqueda: Busca por nombre o SKU.
- Botones: **Todos**, **En línea**, **Local**.

**Tabla de Productos:**
Columnas: Producto | Precio | Stock | Proveedor | Visibilidad | Estado | Acciones.
- Cada fila muestra:
  - Imagen miniatura + nombre + SKU.
  - Precio (y precio tachado si tiene oferta).
  - Stock en rojo si es menor a 5.
  - Visibilidad con badge (En línea / Local / Ambos).
  - Interruptor **Activo/Inactivo**.
  - Menú de 3 puntos (⋯):
    - **"Editar"**: Abre formulario con datos cargados.
    - **"Eliminar"**: Pide confirmación ("¿Estás seguro?") y elimina.

#### 4.3.1 Crear / Editar Producto

**Diálogo de Producto:**

**Sección Datos Básicos:**
- **Nombre del Producto** (obligatorio): Ej. "iPhone 15 Pro".
- **Código / SKU** (obligatorio): Ej. "IPH-15P-256".
- **Descripción**: Características principales.

**Imágenes:**
- Previsualización de imágenes cargadas (máximo 5).
- La primera imagen tiene badge "Principal".
- Pasa el mouse para ver botón **X** (eliminar imagen).
- Área de arrastrar y soltar: Suelta imágenes o haz clic para seleccionar.
- Campo de URL: Pega un link de imagen y presiona **"Agregar"**.

**Categoría y Stock:**
- Selector de **Categoría**: Tecnología, Ropa, Hogar, Alimentos, Salud, Deportes, Juguetes, Libros, Automotriz, Servicios, Otros.
- **Stock Inicial**: Cantidad disponible.

**Proveedor (opcional):**
- Selector con lista de proveedores registrados.

**Gestión Financiera (calculadora automática):**
- **Costo (Compra)**: Lo que te costó el producto.
- **Ganancia (%)**: Margen deseado.
- **Precio Total (Venta)**: Se calcula automático.
> También puedes ingresar Costo + Precio y te calcula el %.

**Visibilidad y Tipo:**
- **Visibilidad**: Solo Online / Solo POS-Local / Ambos.
- **Tipo de Producto**: Producto Físico / Servicio / Producto Digital.

**Botones al final:**
- **"Cancelar"**: Cierra sin guardar.
- **"Crear Producto"** / **"Guardar Cambios"** (verde).

#### 4.3.2 Activar / Desactivar Producto

En la tabla, usa el interruptor (switch) a la derecha de cada producto.
- Azul/verde = Activo (visible para comprar).
- Gris = Inactivo (oculto).

#### 4.3.3 Eliminar Producto

1. En la tabla, presiona los 3 puntos (⋯) del producto.
2. Selecciona **"Eliminar"**.
3. Aparece confirmación del navegador: "¿Estás seguro de que deseas eliminar este producto?"
4. Acepta para eliminar permanentemente.

---

### 4.4 Gestión de Pedidos

Acceso: Barra lateral → "Pedidos", o URL `/vendedor/pedidos`

**Estadísticas:**
- 4 tarjetas con conteo por estado: Pendiente, Confirmado, En preparación, Listo.

**Filtros:**
- Búsqueda por número de orden.
- Botones por estado: Todos, Pendiente, Confirmado, En preparación, Listo, En camino, Entregado.

**Tabla de Pedidos:**
Columnas: Pedido | Cliente | Productos | Total | Estado | Fecha | Acciones.

- Cada fila muestra:
  - Número de orden.
  - Foto + nombre del comprador.
  - Cantidad de ítems.
  - Total en ₲.
  - Estado con badge de color.
  - Fecha y hora.
  - Botones de acción:
    - **"[Siguiente Estado]"** (azul): Avanza el pedido al siguiente paso. Ej: si está "Pendiente", muestra "Confirmado →". Si está "En camino", muestra "Entregado →".
    - **"Ver"** (ghost): Abre diálogo con detalle completo.

**Ver Detalle de Pedido:**
Diálogo que muestra:
- Número de orden.
- Datos del cliente (nombre, teléfono).
- Dirección de entrega.
- Lista de productos con imagen, nombre, cantidad × precio unitario = total.
- Subtotal.
- Comisión de plataforma (si aplica).
- **Tu ganancia** (verde, grande).

---

### 4.5 Punto de Venta (POS)

Acceso: Barra lateral → "POS", o URL `/vendedor/pos`

> **Requisito**: Debes tener la tienda configurada. Si no, te redirige a configurarla.
> Si tu período de prueba expiró, aparece pantalla de bloqueo con botón "Adquirir Suscripción".

**Layout:**
- **Barra superior**: Título "POS", días de trial restantes (si aplica), botón de cliente, campo de búsqueda/escáner, botón "Historial".
- **Área central (izquierda)**: Grid de productos con imagen, nombre, precio y SKU.
- **Panel derecho (desktop)**: Carrito de compra + totales.

**Cómo vender:**

1. **Agregar productos al carrito:**
   - Toca un producto del grid. Emite sonido de beep.
   - O escanea el SKU en el campo de búsqueda (detecta automático).
   - Si ya está en el carrito, aparece badge con la cantidad.

2. **Gestionar el carrito:**
   - Cada línea muestra: imagen, nombre, precio unitario.
   - Botones **"-"** y **"+"** para cambiar cantidad.
   - Icono de basura para quitar el producto.

3. **Totales (panel derecho):**
   - Subtotal.
   - IVA (10%).
   - **TOTAL** en azul grande.
   - Botón **"COBRAR (F2)"**: Abre pantalla de pago.

4. **Asignar cliente (opcional):**
   - Botón superior con icono de persona.
   - Selecciona "Consumidor Final" o un cliente registrado.

5. **Finalizar venta (Checkout):**
   Al presionar "Cobrar" aparece diálogo con:
   - **Monto a Cobrar** en grande.
   - **Tipo de Venta**:
     - **Contado** (azul): Pago inmediato.
     - **Crédito** (ámbar): Venta a fiado. Requiere seleccionar un cliente registrado.
   - **Método de Pago** (tabs):
     - **Efectivo**: Campo "Monto Recibido". Calcula cambio automático.
     - **Tarjeta**: Simulación de terminal.
     - **Wallet**: Muestra código QR para que el cliente escanee y pague. El sistema detecta el pago automáticamente después de unos segundos.
   - Botón **"CONFIRMAR PAGO"** (verde).
   - Botón **"CANCELAR"**.

6. **Comprobante / Ticket:**
   - Al confirmar, aparece ticket digital.
   - Muestra: nombre de tienda, RUC, dirección, teléfono, fecha, número de comprobante, tipo (Contado/Crédito), cliente, ítems, subtotal, IVA, total, método de pago.
   - Botón de impresora para imprimir.

**Historial de Sesión:**
- Botón "Historial" (solo desktop).
- Muestra tabla con: ID, Cliente, Monto, Tipo (Contado/Crédito), Pago (método), Ticket (botón de impresión).

**Accesos rápidos de teclado:**
- **F2**: Abrir cobro.
- **ESC**: Limpiar búsqueda.

---

## 5. MÓDULO INGENIO MILLONARIO

Programa premium de educación financiera. Requiere suscripción activa.

---

### 5.1 Dashboard Financiero

URL: `/ingenio`

> Si no tienes suscripción activa, aparece pantalla de acceso denegado con botón para suscribirse.

**Encabezado:**
- Título: "Finanzas Master"
- Subtítulo: "Control absoluto sobre tu flujo de caja y patrimonio neto."
- Botón **"Registrar Movimiento"** (índigo): Abre diálogo para registrar.

**Alerta de Pago Pendiente (si aplica):**
- Si debes cuotas, aparece banner degradado índigo-morado.
- Muestra: "Has abonado [X] de [Y]".
- Botón **"Pagar Próxima Cuota"**.

**Tarjeta de Patrimonio Neto:**
- Fondo oscuro degradado.
- **Patrimonio Neto Global** en número grande.
- Badge con porcentaje de crecimiento (verde si subió, rojo si bajó).
- Debajo:
  - **Activos Totales** (punto verde).
  - **Pasivos Totales** (punto rojo).

**Ingresos y Egresos del Mes:**
- Dos tarjetas blancas:
  - **Ingresos del Mes** (barra verde izquierda).
  - **Egresos del Mes** (barra roja izquierda).

**Gráfico de Flujo de Caja:**
- Barras comparativas: Ingresos vs Gastos.

### 5.2 Registrar un Movimiento Financiero

1. Presiona **"Registrar Movimiento"**.
2. Diálogo "Nuevo Registro":
   - **Tipo de Movimiento** (selector):
     - Ingreso.
     - Gasto.
     - Activo (suma al patrimonio).
     - Pasivo (resta al patrimonio).
   - **Monto (₲)**: Campo numérico.
   - **Nombre de Registro**: Ej. "Salario", "Alquiler".
   - **Descripción**: Detalles adicionales.
   - **Fecha**: Selector de fecha.
3. Botón **"Guardar Registro"** (índigo).

> Si intentas registrar sin suscripción, aparece el modal de pago.

---

## 6. MÓDULO ADMINISTRADOR

Acceso: Usuarios con rol `superadmin`. URL base: `/admin`

---

### 6.1 Dashboard Admin

URL: `/admin`

**KPIs:**
- Usuarios Totales.
- Tiendas Activas.
- Productos.
- Ventas Hoy.
- Ingresos del Mes.
- Créditos Activos.
- Cada tarjeta tiene porcentaje vs mes anterior (flecha verde/roja).

**Gráficos:**
- **Ventas y Comisiones**: Barras azul (ventas) y verde (comisiones) por mes.
- **Crecimiento de Usuarios**: Línea azul (clientes) y verde (vendedores).
- **Estado de Pedidos**: Gráfico circular (donut) con colores por estado.
- **Pedidos Recientes**: Tabla con orden, cliente, tienda, total, estado.
- **Transacciones Recientes**: Tabla con ID, tipo, descripción, monto, fecha, estado.

**Botones superiores:**
- **"Exportar"**: Descarga datos.
- **"Detalles"**: Más información.

---

### 6.2 Gestión de Usuarios

Acceso: Barra lateral → "Usuarios", o URL `/admin/usuarios`

**Encabezado:**
- Título: "Usuarios"
- Botón **"Nuevo Usuario"** (azul, con +).

**Filtros:**
- Búsqueda por nombre, apellido o email.
- Botones por rol: Todos, Clientes, Vendedores, Admins, Ingenio.

**Tabla de Usuarios:**
Columnas: Usuario | Contacto | Rol | Estado | Ingenio | Registro | Acciones.

- Cada fila:
  - Avatar + nombre + ID truncado.
  - Email + teléfono.
  - Badges de roles con iconos.
  - Badge Activo/Inactivo.
  - Badge Ingenio Activo/Inactivo.
  - Fecha de registro.
  - Menú de 3 puntos (⋯):
    - **"Editar usuario"**: Abre diálogo.
    - **"Ver perfil"**: Diálogo con datos completos.
    - **"Ver transacciones"**: (si implementado).
    - **"Gestionar Plan"** (solo si es vendedor).
    - **"Activar/Desactivar Ingenio"**.
    - **"Desactivar Cuenta"** / **"Activar Cuenta"**.
    - **"Eliminar Usuario"** (rojo).

#### 6.2.1 Editar Usuario

Diálogo "Editar Usuario":
- Campos: Nombre, Apellido, Email, Teléfono.
- **Roles del Usuario** (checkboxes):
  - Cliente (Wallet Oscorp).
  - Vendedor (Comerciante).
  - Estudiante (Ingenio Millonario).
  - Administrador (Super).
- Botones: **"Cancelar"** / **"Guardar Cambios"**.

#### 6.2.2 Ver Perfil de Usuario

Diálogo con:
- Avatar grande.
- Nombre, email, badges de roles y estado.
- Teléfono, fecha de registro, ID.
- Sección "Gestión Ingenio Millonario":
  - Muestra si tiene acceso activo o no.
  - Botón **"Conceder Acceso"** (morado) o **"Revocar Acceso"** (rojo claro).

#### 6.2.3 Eliminar Usuario

1. Menú de 3 puntos → **"Eliminar Usuario"**.
2. Alerta de confirmación: "¿Estás seguro absolutamente? Esta acción eliminará permanentemente al usuario [nombre] y todos sus datos asociados. Esta acción no se puede deshacer."
3. Botones: **"Cancelar"** / **"Confirmar Eliminación"** (rojo).

#### 6.2.4 Gestionar Plan de Vendedor

1. En un usuario con rol vendedor, menú de 3 puntos → **"Gestionar Plan"**.
2. Diálogo:
   - Switch **"Por Comisión"**: Activa modelo basado en % por venta.
   - Si no es por comisión:
     - Selector de **Plan** (Básico, Estándar, Comercial).
     - Selector de **Ciclo de Facturación**: Mensual, Trimestral, Semestral, Anual.
   - Si es por comisión:
     - Campo **"Porcentaje de Comisión"**.
     - Texto explicativo naranja.
3. Botones: **"Cancelar"** / **"Confirmar Asignación"**.

---

### 6.3 Otras Funciones de Admin

El panel de administración incluye estas secciones accesibles desde la barra lateral:

| Sección | Qué se hace |
|---------|-------------|
| **Tiendas** | Ver y gestionar tiendas registradas. |
| **Productos** | Ver productos de todos los vendedores. |
| **Pedidos** | Ver todas las órdenes del sistema. |
| **Finanzas** | Reportes financieros consolidados. |
| **Transacciones** | Ver todas las transacciones de wallets. |
| **Retiros** | Aprobar/rechazar solicitudes de retiro. |
| **Créditos** | Aprobar/rechazar solicitudes de crédito. |
| **Ingenio** | Dashboard del programa, materiales, suscripciones. |
| **Campañas** | Enviar notificaciones push masivas. |
| **Planes** | Configurar planes para vendedores. |
| **Configuración** | Ajustes generales de la plataforma. |

---

## 7. GLOSARIO DE ESTADOS Y TÉRMINOS

### Estados de Pedido (Órdenes)

| Estado | Color | Significado |
|--------|-------|-------------|
| **Pendiente** | Amarillo | El cliente compró, el vendedor aún no ve el pedido. |
| **Confirmado** | Azul | El vendedor confirmó y va a prepararlo. |
| **En preparación** | Púrpura | El vendedor está empacando/organizando. |
| **Listo** | Cyan | Listo para entregar o enviar. |
| **En camino** | Índigo | El delivery está llevando el pedido. |
| **Entregado** | Verde | El cliente recibió el pedido. |
| **Cancelado** | Rojo | El pedido fue cancelado. |
| **Reembolsado** | Gris | Se devolvió el dinero. |

### Estados de Crédito

| Estado | Color | Significado |
|--------|-------|-------------|
| **Pendiente** | Ámbar | Solicitado, esperando aprobación/documentos. |
| **Aprobado** | Azul | Aprobado por admin, aún no desembolsado. |
| **Activo** | Verde | Dinero entregado, en período de pago de cuotas. |
| **Completado** | Gris | Todas las cuotas pagadas. |
| **Rechazado** | Rojo | La solicitud fue denegada. |
| **Cancelado** | Naranja | El solicitante canceló antes de aprobación. |

### Estados de Suscripción Ingenio

| Estado | Significado |
|--------|-------------|
| **PENDING_PAYMENT** | Solicitado, esperando que pague la primera cuota. |
| **PENDING_APPROVAL** | Pagó por transferencia, esperando que admin apruebe. |
| **ACTIVE** | Suscripción activa, acceso completo. |
| **REVOKED** | Acceso cancelado por falta de pago o decisión admin. |

### Tipos de Transacción

| Tipo | Significado |
|------|-------------|
| `income` | Ingreso registrado manualmente. |
| `expense` | Gasto registrado manualmente. |
| `transfer_in` | Dinero recibido de otro usuario. |
| `transfer_out` | Dinero enviado a otro usuario. |
| `purchase` | Compra en marketplace. |
| `sale` | Venta en marketplace. |
| `deposit` | Carga de dinero a la wallet. |
| `withdrawal` | Retiro de dinero de la wallet. |
| `credit` | Dinero recibido de un crédito aprobado. |
| `commission` | Comisión cobrada por la plataforma. |
| `fee` | Tarifa por servicio. |

---

## NOTAS FINALES

- **Moneda**: El sistema usa Guaraníes paraguayos (₲ / PYG) por defecto.
- **Seguridad**: Las transferencias y pagos requieren PIN de 4 dígitos. Configúralo la primera vez que realices una operación.
- **Notificaciones**: Activa las notificaciones push en tu perfil para recibir alertas de pagos, pedidos y estados en tiempo real.
- **Roles múltiples**: Un mismo usuario puede ser cliente, vendedor y estudiante. Los datos se comparten entre roles.
- **Soporte**: Para ayuda adicional, contacta al administrador de tu plataforma.

---

*Manual de Usuario Oscorp Platform — Versión 1.0*
