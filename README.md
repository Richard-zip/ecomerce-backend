# 🎓 CampusMarket • Centro Tutorial Cereté 🛒

> **Plataforma Integral de Comercio Electrónico Estudiantil para el Centro Tutorial Cereté (Universidad de Cartagena).**  
> Facilita la compra, venta y reserva de libros, calculadoras, útiles, tecnología, indumentaria y servicios entre estudiantes, con coordinación de entregas seguras dentro del campus y precios en Pesos Colombianos (COP).

---

## 📑 Tabla de Contenidos

1. [Visión General del Proyecto](#-visión-general-del-proyecto)
2. [Características Principales](#-características-principales)
3. [Diagramas de Arquitectura y Flujos](#-diagramas-de-arquitectura-y-flujos)
   - [1. Arquitectura General del Sistema](#1-arquitectura-general-del-sistema)
   - [2. Diagrama Entidad-Relación (ERD)](#2-diagrama-entidad-relación-erd)
   - [3. Flujo de Autenticación y Cuentas Duales](#3-flujo-de-autenticación-y-cuentas-duales)
   - [4. Flujo de Recuperación de Contraseña con Gmail SMTP](#4-flujo-de-recuperación-de-contraseña-con-gmail-smtp)
   - [5. Flujo de Pedidos y Transacción Atómica de Stock](#5-flujo-de-pedidos-y-transacción-atómica-de-stock)
   - [6. Visualizador Multi-ángulo y Zoom al Cursor](#6-visualizador-multi-ángulo-y-zoom-al-cursor)
4. [Stack Tecnológico](#-stack-tecnológico)
5. [Estructura del Repositorio](#-estructura-del-repositorio)
6. [Guía de Configuración e Instalación](#-guía-de-configuración-e-instalación)
   - [Variables de Entorno Backend (`.env`)](#variables-de-entorno-backend-env)
   - [Variables de Entorno Frontend (`.env`)](#variables-de-entorno-frontend-env)
   - [Comandos de Puesta en Marcha](#comandos-de-puesta-en-marcha)
7. [Referencia de la API RESTful](#-referencia-de-la-api-restful)
8. [Seguridad y Reglas de Negocio](#-seguridad-y-reglas-de-negocio)

---

## 🌟 Visión General del Proyecto

**CampusMarket** nace de la necesidad de conectar a la comunidad universitaria del **Centro Tutorial Cereté** para intercambiar bienes y servicios académicos de manera directa, transparente y segura. 

A diferencia de los e-commerce convencionales, la plataforma está adaptada al contexto estudiantil:
- **Precios en Pesos Colombianos (COP)** con formateo localizado.
- **Puntos de encuentro dentro del campus** (Biblioteca, Cafetería, Pasillo Central, Kiosco).
- **Cuentas duales**: Un mismo estudiante puede comprar y vender utilizando su mismo correo electrónico y datos institucionales.
- **Recuperación de contraseña por correo Gmail institucional** con código de seguridad de 6 dígitos.
- **Visualizador interactivo multi-ángulo (360°)** y zoom dinámico al pasar el cursor para inspeccionar el estado real de los artículos.

---

## 🚀 Características Principales

### 1. Cuentas Duales y Cambio de Modalidad Instantáneo
- Los estudiantes pueden registrarse como **Comprador** (`CLIENTE`) o **Vendedor** (`VENDEDOR`).
- Pueden poseer **ambas modalidades bajo el mismo correo electrónico**.
- En la barra de navegación (Navbar), disponen de un botón para **alternar con 1 solo clic** entre el modo Comprador y el modo Vendedor sin cerrar sesión ni volver a escribir credenciales.

### 2. Recuperación de Contraseña Segura vía Gmail SMTP
- Integración nativa con **Google Gmail SMTP** y plantillas HTML con colores oficiales institucionales de Cereté (Azul Marino `#102A43` y Dorado `#D6A84F`).
- Generación de código numérico aleatorio de **6 dígitos** con tiempo de vida estricto de **15 minutos**.
- Botón de visibilidad de contraseña (👁️ ver / ocultar) en todos los formularios para evitar errores de escritura.

### 3. Visualizador de Producto 360° Multi-ángulo y Zoom al Cursor
- Permite subir y visualizar múltiples fotos desde distintos ángulos.
- Navegación rápida mediante miniaturas y carrusel.
- **Lupa de aumento**: Al posar el ratón sobre la imagen principal, se activa una ventana de zoom que amplía los detalles del producto sin recargar la página.

### 4. Panel de Vendedor Exclusivo
- Vista tipo tarjeta/lista dedicada exclusivamente a la gestión de productos propios (crear, editar precio/stock, pausar o eliminar).
- **Protección contra auto-compra**: La interfaz de vendedor está aislada del carrito para evitar que los vendedores compren sus propios artículos.

### 5. Control Atómico de Inventario y Pedidos en Campus
- Cuando un comprador reserva un producto, el stock se descuenta en una **transacción ACID** en la base de datos PostgreSQL.
- Si un pedido es cancelado por el comprador o rechazado por el vendedor, el stock se **repone automáticamente**.

### 6. Categorías Universitarias Auto-configuradas
- Siete categorías oficiales con auto-poblado en el arranque del servidor:
  1. 📚 **Libros y Manuales**
  2. 💻 **Tecnología y Calculadoras**
  3. ✏️ **Papelería y Útiles**
  4. 🥪 **Snacks y Comida**
  5. 👕 **Ropa y Merchandising**
  6. 🖨️ **Servicios e Impresiones**
  7. 🎒 **Varios y Accesorios**

---

## 📊 Diagramas de Arquitectura y Flujos

### 1. Arquitectura General del Sistema

```mermaid
flowchart TD
    subgraph Frontend["Frontend SPA (React + Vite + Tailwind CSS)"]
        UI["Interfaz de Usuario (Cereté Theme)"]
        State["Contextos (AuthContext, CartContext)"]
        ServiceLayer["Servicios API (Axios / Fetch)"]
        UI --> State
        State --> ServiceLayer
    end

    subgraph Backend["Backend API (Node.js + Express + TypeScript)"]
        Router["Enrutador Central (/api)"]
        Middlewares["Middlewares (Auth JWT, Roles, Multer, ErrorHandler)"]
        Controllers["Controladores (Auth, Products, Orders, Categories)"]
        Services["Lógica de Negocio (AuthService, MailService, etc.)"]
        PrismaORM["Prisma ORM Client"]

        Router --> Middlewares
        Middlewares --> Controllers
        Controllers --> Services
        Services --> PrismaORM
    end

    subgraph CloudServices["Infraestructura y Servicios en la Nube"]
        NeonDB[("PostgreSQL Serverless (Neon DB)")]
        VercelBlob["Vercel Blob Storage (CDN de Imágenes)"]
        GmailSMTP["Servidor Google Gmail SMTP (Nodemailer)"]
    end

    ServiceLayer -->|Peticiones HTTP REST / JSON| Router
    PrismaORM -->|Consultas SQL Seguras| NeonDB
    Services -->|Upload Multipart| VercelBlob
    Services -->|Envío de Códigos de Verificación| GmailSMTP
```

---

### 2. Diagrama Entidad-Relación (ERD)

```mermaid
erDiagram
    User ||--o{ Product : "publica como vendedor"
    User ||--o{ Order : "crea como comprador"
    User ||--o{ Order : "recibe como vendedor"
    User ||--o{ Review : "califica como comprador"
    User ||--o{ Review : "recibe como vendedor"
    Category ||--o{ Product : "clasifica"
    Order ||--|{ OrderItem : "contiene"
    Product ||--o{ OrderItem : "se incluye en"
    Product ||--o{ Review : "recibe reseñas"

    User {
        string id PK
        string name
        string email
        string password
        string phone
        string whatsapp
        enum role "CLIENTE | VENDEDOR"
        string avatar
        string career
        string campus "Centro Tutorial Cereté"
        string resetToken
        datetime resetTokenExpires
        datetime createdAt
        datetime updatedAt
    }

    Category {
        string id PK
        string name UK
        string slug UK
        string description
        datetime createdAt
        datetime updatedAt
    }

    Product {
        string id PK
        string title
        string description
        float price
        int stock
        string[] images
        enum condition "NUEVO | COMO_NUEVO | USADO_BUENO | USADO_REGULAR"
        enum status "AVAILABLE | PAUSED | SOLD_OUT"
        string meetingPoint
        string sellerId FK
        string categoryId FK
        datetime createdAt
        datetime updatedAt
    }

    Order {
        string id PK
        int orderNumber
        enum status "PENDING | CONFIRMED | DELIVERED | CANCELLED"
        float totalAmount
        string meetingPoint
        string notes
        string buyerId FK
        string sellerId FK
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        int quantity
        float unitPrice
        datetime createdAt
    }

    Review {
        string id PK
        int rating "1 a 5 estrellas"
        string comment
        string buyerId FK
        string sellerId FK
        string productId FK
        datetime createdAt
    }
```

---

### 3. Flujo de Autenticación y Cuentas Duales

```mermaid
sequenceDiagram
    autonumber
    actor Estudiante as Estudiante Universitario
    participant Front as Frontend (React / Navbar)
    participant Back as Backend (/api/auth)
    participant DB as Neon PostgreSQL

    Note over Estudiante,DB: Inicio de Sesión o Alternancia de Rol
    Estudiante->>Front: Selecciona rol (Comprador o Vendedor) e inicia sesión
    Front->>Back: POST /api/auth/login { email, password, role }
    Back->>DB: Busca cuenta con email y rol específico
    DB-->>Back: Retorna usuario y hash de contraseña
    Back->>Back: Valida hash con bcrypt y genera Token JWT
    Back-->>Front: { token, user: { id, name, role } }
    Front-->>Estudiante: Acceso concedido al panel respectivo

    opt Cambio de Modalidad con 1 Clic (Switch Role)
        Estudiante->>Front: Clic en "Cambiar a Vendedor" o "Cambiar a Comprador"
        Front->>Back: POST /api/auth/switch-role { targetRole } con Bearer Token
        Back->>DB: Busca o crea automáticamente la cuenta contraparte
        DB-->>Back: Cuenta contraparte lista
        Back->>Back: Genera nuevo JWT para la nueva modalidad
        Back-->>Front: { token, user: { ...targetRole } }
        Front-->>Estudiante: Redirige fluidamente sin desloguear
    end
```

---

### 4. Flujo de Recuperación de Contraseña con Gmail SMTP

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Estudiante
    participant Front as ForgotPasswordPage
    participant Back as Backend (/api/auth)
    participant SMTP as Google Gmail SMTP
    participant DB as Neon PostgreSQL

    Usuario->>Front: Ingresa su correo (ej: alumno@unicartagena.edu.co)
    Front->>Back: POST /api/auth/forgot-password { email }
    Back->>DB: Verifica existencia de cuenta con ese email
    alt Usuario NO existe
        DB-->>Back: No encontrado
        Back-->>Front: Error 404 (con enlace sugerido a /register)
        Front-->>Usuario: "No se encontró cuenta. ¿Deseas registrarte?"
    else Usuario Existe
        Back->>Back: Genera código aleatorio de 6 dígitos
        Back->>DB: Guarda resetToken y resetTokenExpires (15 min)
        Back->>SMTP: Envía email HTML con plantilla institucional
        SMTP-->>Usuario: Correo recibido con código de 6 dígitos
        Back-->>Front: 200 OK: "Código enviado"
        Front-->>Usuario: Avanza al Paso 2 (Ingreso de código y nueva clave)
    end

    Usuario->>Front: Ingresa código + Nueva contraseña
    Front->>Back: POST /api/auth/reset-password { email, code, newPassword }
    Back->>DB: Valida que el código coincida y resetTokenExpires > ahora
    Back->>Back: Encripta nueva clave con bcrypt
    Back->>DB: Actualiza password y limpia resetToken = null
    Back-->>Front: 200 OK: "Contraseña actualizada exitosamente"
    Front-->>Usuario: Muestra pantalla de éxito y botón para ir a /login
```

---

### 5. Flujo de Pedidos y Transacción Atómica de Stock

```mermaid
flowchart TD
    Start(["Comprador añade productos al carrito"]) --> ReviewCart["Revisión de Carrito y Lugar de Encuentro en Cereté"]
    ReviewCart --> SubmitOrder["Confirmar Pedido (POST /api/orders)"]
    
    SubmitOrder --> TxBegin{"Transacción Atómica en Base de Datos"}
    TxBegin -->|Validar Stock| CheckStock{"¿Hay stock suficiente?"}
    
    CheckStock -->|No| Rollback["Cancela transacción y muestra error al usuario"]
    CheckStock -->|Sí| DeductStock["Descuenta stock inmediatamente (stock = stock - cantidad)"]
    DeductStock --> CreateOrder["Crea registro en Order (Estado: PENDING)"]
    CreateOrder --> TxCommit["Confirma Transacción (Commit)"]
    
    TxCommit --> SellerNotice["Vendedor ve pedido en su panel (/seller)"]
    
    SellerNotice --> Decision{"Acción del Vendedor o Comprador"}
    Decision -->|Comprador cancela| CancelOrder["PATCH /orders/:id/cancel"]
    Decision -->|Vendedor rechaza| RejectOrder["PATCH /orders/:id/status (CANCELLED)"]
    Decision -->|Entrega en Campus| DeliverOrder["PATCH /orders/:id/status (DELIVERED)"]
    
    CancelOrder --> Restock["Transacción: Se repone el stock automáticamente en inventario"]
    RejectOrder --> Restock
    Restock --> EndCancelled(["Pedido Cancelado"])
    
    DeliverOrder --> ReviewPrompt["Cliente califica al vendedor (1 a 5 estrellas + comentario)"]
    ReviewPrompt --> EndDelivered(["Pedido Completado con Éxito"])
```

---

### 6. Visualizador Multi-ángulo y Zoom al Cursor

```mermaid
flowchart LR
    A["Vendedor sube múltiples fotos"] --> B["Vercel Blob Storage CDN"]
    B --> C["Detalle de Producto (ProductDetailPage)"]
    C --> D["Carrusel / Miniaturas Multi-Ángulo 360°"]
    D --> E["Usuario pasa el cursor sobre la foto"]
    E --> F["Detección de Coordenadas del Ratón (X, Y en %)"]
    F --> G["Lupa de Zoom Dinámica con Transform Scale (2.2x)"]
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Interfaz moderna, rápida y adaptable |
| **Iconografía** | Lucide React | Iconos limpios e institucionales |
| **Enrutamiento** | React Router v7 | Navegación SPA con control de acceso por rol |
| **Backend** | Node.js, Express 5, TypeScript | API REST modular, tipada y escalable |
| **ORM** | Prisma ORM | Modelado de datos, migraciones y tipado seguro |
| **Base de Datos** | PostgreSQL (Neon Serverless) | Almacenamiento relacional en la nube |
| **Almacenamiento** | Vercel Blob Storage | CDN para imágenes de productos y avatares |
| **Correos** | Nodemailer + Google Gmail SMTP | Envío de códigos de verificación de 6 dígitos |
| **Seguridad** | bcryptjs, jsonwebtoken (JWT), Zod | Cifrado de contraseñas, tokens y validación estricta |

---

## 📁 Estructura del Repositorio

```text
e-commerce-universitary-backend/
├── prisma/
│   ├── schema.prisma              # Modelado de Base de Datos relacional
│   └── seed.ts                    # Seeder de Categorías oficiales de Cereté
├── src/
│   ├── config/
│   │   ├── env.ts                 # Variables de entorno centralizadas
│   │   └── prisma.ts              # Instancia única de Prisma Client
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # Verificación de JWT y roles
│   │   ├── error.middleware.ts    # Manejador global de excepciones
│   │   └── upload.middleware.ts   # Multer para subida en memoria
│   ├── modules/
│   │   ├── auth/                  # Registro, Login, Switch Role, Forgot/Reset Password
│   │   ├── categories/            # Gestión y consulta de categorías
│   │   ├── orders/                # Pedidos, checkout y calificaciones
│   │   ├── products/              # Catálogo, CRUD y filtros
│   │   ├── uploads/               # Conexión con Vercel Blob Storage
│   │   └── users/                 # Perfil público y privado de estudiantes
│   ├── routes/
│   │   └── index.ts               # Agrupador central de rutas REST
│   ├── services/
│   │   └── mail.service.ts        # Transporter SMTP Gmail y plantillas HTML
│   ├── app.ts                     # Configuración de Express, CORS y parseo
│   └── server.ts                  # Arranque del servidor y auto-seeding
├── .env                           # Variables de entorno
├── package.json
└── tsconfig.json
```

---

## ⚙️ Guía de Configuración e Instalación

### Requisitos Previos
- **Node.js**: Versión 18 o superior (recomendado Node 20 LTS o 22).
- **npm** o **pnpm**.

---

### Variables de Entorno Backend (`.env`)

Crea un archivo `.env` en la raíz de `e-commerce-universitary-backend`:

```env
# Puerto del servidor
PORT=4000

# Conexión a Neon PostgreSQL
DATABASE_URL="postgresql://usuario:password@ep-hidden-bird.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=30"
DIRECT_URL="postgresql://usuario:password@ep-hidden-bird.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30"

# Token de Vercel Blob Storage
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxxxxxxxxxxx"

# JWT
JWT_SECRET="super_secret_university_ecommerce_jwt_key_2025"
JWT_EXPIRES_IN="7d"

# Configuración Gmail SMTP para recuperación de contraseñas
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_USER="tu_correo_gmail@gmail.com"
SMTP_PASS="tu_contraseña_de_aplicacion_de_16_letras"
SMTP_FROM="CampusMarket <soporte@campusmarket.edu.co>"
```

> [!NOTE]
> Para obtener la `SMTP_PASS`, dirígete a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), activa la verificación en dos pasos y genera una nueva contraseña de aplicación para `CampusMarket`.

---

### Variables de Entorno Frontend (`.env`)

Crea un archivo `.env` en la raíz de `e-commerce-universitary-frontend`:

```env
VITE_API_URL="http://localhost:4000/api"
```

---

### Comandos de Puesta en Marcha

#### 1. Iniciar el Backend

```bash
cd e-commerce-universitary-backend

# 1. Instalar dependencias
npm install

# 2. Sincronizar modelos con la base de datos
npm run prisma:push

# 3. Poblar categorías universitarias iniciales
npm run seed

# 4. Iniciar en modo desarrollo
npm run dev
```
> El backend quedará escuchando en `http://localhost:4000`.

#### 2. Iniciar el Frontend

```bash
cd e-commerce-universitary-frontend

# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev
```
> El frontend estará disponible en `http://localhost:5173`.

---

## 📡 Referencia de la API RESTful

Todas las rutas responden en formato JSON y tienen como prefijo base `/api`.

### 1. Autenticación (`/api/auth`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Público | Registra una cuenta (CLIENTE o VENDEDOR). |
| `POST` | `/auth/login` | Público | Inicia sesión y retorna JWT + datos de usuario. |
| `POST` | `/auth/switch-role` | Autenticado | Alterna entre modalidad Comprador y Vendedor. |
| `POST` | `/auth/forgot-password`| Público | Genera y envía código de 6 dígitos por Gmail. |
| `POST` | `/auth/reset-password` | Público | Valida código y actualiza la contraseña con bcrypt. |
| `GET` | `/auth/profile` | Autenticado | Obtiene la información del usuario autenticado. |

### 2. Categorías (`/api/categories`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Público | Lista todas las categorías con el conteo de productos. |
| `GET` | `/categories/:id` | Público | Detalle de la categoría y sus productos disponibles. |
| `POST` | `/categories` | Rol VENDEDOR | Crea una nueva categoría. |

### 3. Productos (`/api/products`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Público | Catálogo con filtros (`search`, `categoryId`, `condition`, precios, paginación). |
| `GET` | `/products/detail/:id`| Público | Ficha detallada del producto, vendedor y fotos multi-ángulo. |
| `POST` | `/products` | Rol VENDEDOR | Publica un nuevo producto. |
| `GET` | `/products/my/products`| Rol VENDEDOR | Lista los productos publicados por el vendedor actual. |
| `PUT` | `/products/:id` | Rol VENDEDOR | Modifica título, precio, descripción, stock o estado. |
| `DELETE`| `/products/:id` | Rol VENDEDOR | Elimina un producto propio. |

### 4. Pedidos y Compras (`/api/orders`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Rol CLIENTE | Crea orden de compra con descuento atómico de stock. |
| `GET` | `/orders/my/purchases`| Rol CLIENTE | Historial de pedidos realizados por el comprador. |
| `PATCH`| `/orders/:id/cancel` | Rol CLIENTE | Cancela pedido pendiente y repone el stock en inventario. |
| `GET` | `/orders/my/sales` | Rol VENDEDOR | Pedidos recibidos para entregar a compañeros de campus. |
| `PATCH`| `/orders/:id/status` | Rol VENDEDOR | Actualiza estado a `CONFIRMED`, `DELIVERED` o `CANCELLED`. |
| `POST` | `/orders/reviews` | Rol CLIENTE | Deja calificación y reseña (1 a 5 estrellas) al vendedor. |

### 5. Carga de Archivos (`/api/upload`)
| Método | Endpoint | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/upload/single` | Autenticado | Sube 1 archivo a la CDN de Vercel Blob y retorna la URL pública. |
| `POST` | `/upload/multiple` | Autenticado | Sube hasta 5 archivos simultáneos (ideal para fotos multi-ángulo). |

---

## 🔒 Seguridad y Reglas de Negocio

1. **Aislamiento de Cuentas Duales**:
   - La restricción de unicidad en base de datos es compuesta: `@@unique([email, role])`. Esto previene colisiones y garantiza que las órdenes de compra y los productos en venta de un mismo alumno se mantengan separados con su lógica correspondiente.
2. **Expiración Estricta de Tokens**:
   - Los tokens JWT caducan en 7 días por defecto.
   - Los códigos de verificación de 6 dígitos expiran en 15 minutos exactos y se anulan de inmediato una vez utilizados.
3. **Manejo Seguro de Contraseñas**:
   - Todas las contraseñas se almacenan con salt rounds de `bcryptjs`. Jamás se guardan ni se retornan en texto plano en las respuestas del API.
4. **Integridad Transaccional**:
   - Las operaciones de compra y cancelación se ejecutan dentro de bloques `$transaction` de Prisma, evitando condiciones de carrera (*race conditions*) sobre el stock de los productos.

---

## 🏛️ Créditos Institucionales
- **Proyecto**: E-Commerce Universitario — CampusMarket
- **Campus**: Centro Tutorial Cereté — Universidad de Cartagena
- **Desarrollo**: Ingeniería de Software y Comercio Estudiantil
