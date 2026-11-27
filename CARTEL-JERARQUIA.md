# Jerarquía de los carteles (reporte de código)

Reporte de cómo está armada la jerarquía de los carteles en `cartel.js` (mod base del juego). Todo sale del código, no de la vida real. Los números son los del archivo actual.

## 1. Los carteles

Hay **5 carteles**, todos con la misma estructura y escalafón:

| Clave | Nombre |
| --- | --- |
| `norte` | Cartel del Norte |
| `halcones` | Los Halcones |
| `golfo` | Gulf Coast Cartel |
| `roja` | La Mano Roja |
| `pacifico` | Pacific Cartel |

Se entra desde **Special Careers → Cartel**. Requisitos: 18+ años, no estar en prisión, no trabajar ya para otro cartel ni para una familia de la mafia. Si traicionaste a un cartel (`hunted`), ninguno te acepta durante 10 años.

Al entrar se prueba suerte con una de cinco ofertas (ser Halcón, mirador, chofer, vender en la esquina u ocultar producto). La probabilidad base es `0.3 + 0.05 × arrestos previos (máx. +0.3) + bonus de la oferta (0 a 0.07)`, con techo del 85%. Solo se puede intentar **una vez por año**; si fallas, esperas al siguiente.

Estado inicial: rango 0, **standing 25–40**, notoriedad `min(30, 3 × arrestos)`, heat 0, deuda 0, una pickup y ~3–5 compañeros de rango 0.

## 2. Los cinco rangos

| # | Rango | Nombre femenino | Corte por carga | Carga máxima | Cupo en la organización* |
| --- | --- | --- | --- | --- | --- |
| 0 | Halcón | — | 8% | $25,000 | sin límite |
| 1 | Mule | — | 9% | $80,000 | sin límite |
| 2 | Trafficker | — | 9% | $400,000 | 4 (tú incluido) |
| 3 | Lieutenant | — | 10% | $2,000,000 | 2 (tú incluido) |
| 4 | El Patrón | La Patrona | 10% | $8,000,000 | 1 (solo el jefe) |

\* La tabla `g = [99, 99, 4, 2, 1]`. El cupo cuenta miembros vivos de ese rango **más tú** si estás en él.

- El corte se aplica al valor de cada carga movida (`redondeo(valor × corte)`).
- La carga máxima define cuánto producto te confía el cartel por viaje (y limita el tamaño de los encargos que se generan).
- **Ascender da un vehículo gratis** de ese rango: pickup → sedán con compartimento → semi con carga falsa → lancha rápida → avión privado. Al bajar de rango te lo quitan.
- El **rango 4 es único**: solo puede haber un Patrón/Patrona.

## 3. Qué desbloquea cada rango

**Producto** (`rank` mínimo de cada droga):

- Rango 0: marihuana.
- Rango 1: hongos y éxtasis.
- Rango 2: metanfetamina y cocaína.
- Rango 3: heroína y fentanilo.
- Rango 4: todo.

**Cargas por año:** se generan `3 + rango` encargos anuales (de 3 a 7).

**Ingresos de plaza:** desde rango 1 (Mule). Cada plaza aporta `ctrl/100 × ct[rango]`, con `ct = [0, $1,500, $10,000, $60,000, $450,000]`; el total se cobra cada año, junto con el dinero de protección de los negocios.

**Vehículos:** cada rango desbloquea el suyo (ver arriba). Los vehículos tienen capacidad, probabilidad de que los paren, habilidad para esconder la carga y si pueden huir.

## 4. Cómo se asciende

Solo se puede **pedir el ascenso una vez por año** (Career → Promotion). El juego evalúa, en este orden:

1. **Deuda:** si debes dinero al cartel, te rechazan de inmediato.
2. **Cargas en el rango actual:** `runsRank >= [3, 4, 5, 6][rango]`. Es decir, para salir de Halcón necesitas 3 cargas movidas; de Mule, 4; de Trafficker, 5; de Lieutenant, 6.
3. **Standing ≥ 55.**
4. **Que haya hueco:** `miembros_del_rango_superior + (tú si estás en él) < g[rango_superior]`. Si el puesto está ocupado, te dicen que no hay vacantes ("alguien tendrá que retirarse… o morir").
5. **Tirada:** `0.45 + standing/200` (con standing 55 → ~72,5%; con 100 → 95%).

Al ascender: sube el rango, se reinicia el contador de cargas del rango, el standing se queda en **mínimo 55**, te dan el vehículo nuevo y, en rangos 3+, se degrada a un subordinado del mismo rango para respetar el cupo.

### El último escalón no es un ascenso: es un golpe

Para llegar a **El Patrón** no hay vacante: hay que **matar al jefe** (`Take out the Patrón`).

- Éxito: `0.4 + standing/300` (standing 55 → ~58%; 100 → ~73%). Si sale bien, el jefe muere, ganas +25 de notoriedad y tomas el cartel.
- Si falla: 50% de morir ejecutado; si no, pierdes 40 de standing y 30–50 de salud.
- Si el Patrón ya murió por otra causa, el puesto queda vacío y **te ascienden directo** al pedirlo.

### Ascensos y descensos automáticos (los hace el cartel cada año)

La jerarquía se mueve sola:

- **Vacantes:** cuando muere alguien de rango 2, 3 o 4, el cartel rellena el hueco promoviendo al miembro **con mejor relación** del rango inmediatamente inferior.
- **Tú también puedes ser promovido sin pedirlo:** si eres el rango justo debajo de la vacante, tienes `runsRank >= 2`, deuda 0 y sale la tirada (50% con standing ≥ 60, 20% si no).
- **Descenso:** el jefe te baja un rango si pierdes 2+ cargas en el año, si tu standing cae a 25 o menos, o si llevas 2 años en rango 1+ sin mover ninguna carga. El standing queda en mínimo 30 y pierdes el vehículo del rango.
- **Despido:** con standing ≤ 3 hay 40% anual de que el cartel deje de darte trabajo (pierdes el empleo, no la vida).
- **Presión anual:** si no ganaste nada en el año (y llevas al menos uno en el cartel), el standing baja 4–9.

## 5. Las tres barras que gobiernan la carrera

| Métrica | Para qué sirve | Cómo se mueve |
| --- | --- | --- |
| **Standing** | Requisito de ascenso (≥ 55) y probabilidad de que te acepten; también decide ascensos/descensos automáticos y despido | Sube con trabajo duro (+2–6/año), cargas entregadas (+4–9), redadas exitosas, delaciones acertadas, reuniones y buenos años; baja al perder cargas, acusar a un inocente, faltar a reuniones, no ganar nada en el año |
| **Notoriedad** | Prestigio criminal: intimida en extorsiones y protecciones (la tirada usa `fear + notoriedad/3`) y pesa en algunas operaciones de territorio | Sube al mover producto, matar rivales o exponer ratas; baja sola 0–2 por año. No es requisito de ascenso |
| **Heat** | Riesgo policial | Sube con cargas, muertes y golpes; baja 6–14 por año. Con heat ≥ 70 hay una tirada de redada de la DEA (`(heat − 60)/100`); si cae, arresto por narcotráfico |

Hay además **deuda** con el cartel: bloquea ascensos y, si pasa la fecha límite sin pagar, el cartel manda a cobrar (con violencia).

## 6. Los compañeros también tienen rango

El cartel mantiene ~14 miembros vivos. El jefe aparece primero (rango 4) y debajo los "coworkers" con su propio rango visible (Halcón, Mule, Trafficker…). Con ellos puedes conversar, halagar, hacerte amigo, dar regalos, pasar tiempo, insultar, **exponerlos como rata de la DEA** o **mandarlos a matar**:

- Exponer a una rata real: +15 standing y +5 notoriedad.
- Exponer a un inocente: −15 standing, −30 de relación y 10% de que el cartel te mate por la falsa acusación.
- Mandar a matar: 75% − 8% por rango del objetivo; si sale mal, puede que el cartel descubra que fuiste tú (30% + 10% por rango), con riesgo de muerte, −25 standing y −20/−40 de salud.

Los miembros envejecen y mueren (3,5% anual, +8% si tienen más de 70), lo que abre huecos y dispara la danza de ascensos.

## 7. Cómo encaja con el dinero sucio (cambio reciente)

Desde el mod **Money Laundering**, todos los pagos del cartel (cargas, plazas, protección, cobros, redadas, bonos del jefe) ya **no entran al banco**: van a `state.launder.dirty` mediante `dirtyPay()` en `cartel.js`. Para gastarlos hay que lavarlos en **Activities → Money Laundering**, y la vía más barata y con más cupo es usar una carrera legítima como fachada:

- **Estudio de cine** (`state.dir`, rep × capacidad): hasta decenas de millones al año.
- **Sello musical** (`state.music.releases`): ~$150k + $400k por disco.
- **Contrato pro** (`state.job.salary` con NBA o fútbol): ~4× el salario.

Cada pago sucio deja un **caso**; años después puede reabrirse y terminar en una acusación por narcotráfico o lavado. La jerarquía no protege de eso: el heat del cartel también sube el riesgo de auditoría.

## 8. Lectura de diseño y hallazgos

- **El corte casi no crece** (8% → 10%) mientras la carga máxima se multiplica por 320 ($25k → $8M). La progresión real no está en el porcentaje sino en **volumen, plazas y vehículos**.
- **El cuello de botella es el standing y las cargas**, no el dinero: por eso trabajar duro, no perder cargas y cuidar las relaciones pesa más que ganar mucho en un año.
- **El rango 4 es el único sin "siguiente"**: no hay vacante, no hay tirada de ascenso normal, solo el golpe. Es la única rama con riesgo de muerte directa por ambición.
- **Hay movilidad automática**: te pueden ascender sin pedirlo y bajarte si rindes mal. La organización se siente viva, pero también castiga años de inactividad.
- **Saltos de jefe:** `V()` devuelve el rango superior más cercano que exista, no necesariamente el jefe inmediato; si hay huecos, puedes acabar "reportando" a alguien dos escalones arriba.
- **Cupos vs. relleno:** la tabla de cupos y el bucle anual de relleno están sincronizados (3 Traffickers + tú = 4; 2 Lieutenants máx.; 1 Patrón), así que las vacantes reales son escasas y muchas veces hay que esperar una muerte.
- **El nuevo lavado cambia el ritmo:** con el cartel pagando en dinero sucio, subir de rango ya no basta para gastar; hay que sostener una fachada (carrera o negocio) y eso ata la carrera criminal a la economía legal.
