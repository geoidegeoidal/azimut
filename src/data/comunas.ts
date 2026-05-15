import { REGIONES } from "./regiones";

export interface Comuna {
  nombre: string;
  region: string;
  alias: string[];
}

export const COMUNAS: Comuna[] = [
  { nombre: "Arica", region: "Arica y Parinacota", alias: [] },
  { nombre: "Camarones", region: "Arica y Parinacota", alias: [] },
  { nombre: "General Lagos", region: "Arica y Parinacota", alias: [] },
  { nombre: "Putre", region: "Arica y Parinacota", alias: [] },
  { nombre: "Alto Hospicio", region: "Tarapacá", alias: ["Altohospicio"] },
  { nombre: "Camiña", region: "Tarapacá", alias: ["Camina"] },
  { nombre: "Colchane", region: "Tarapacá", alias: [] },
  { nombre: "Huara", region: "Tarapacá", alias: [] },
  { nombre: "Iquique", region: "Tarapacá", alias: [] },
  { nombre: "Pica", region: "Tarapacá", alias: [] },
  { nombre: "Pozo Almonte", region: "Tarapacá", alias: ["Pozoalmonte"] },
  { nombre: "Antofagasta", region: "Antofagasta", alias: [] },
  { nombre: "Calama", region: "Antofagasta", alias: [] },
  { nombre: "María Elena", region: "Antofagasta", alias: ["Maria Elena"] },
  { nombre: "Mejillones", region: "Antofagasta", alias: [] },
  { nombre: "Ollagüe", region: "Antofagasta", alias: ["Ollague"] },
  { nombre: "San Pedro de Atacama", region: "Antofagasta", alias: ["SanPedro", "San Pedro"] },
  { nombre: "Sierra Gorda", region: "Antofagasta", alias: ["Sierragorda"] },
  { nombre: "Taltal", region: "Antofagasta", alias: [] },
  { nombre: "Tocopilla", region: "Antofagasta", alias: [] },
  { nombre: "Alto del Carmen", region: "Atacama", alias: ["Altodelcarmen"] },
  { nombre: "Caldera", region: "Atacama", alias: [] },
  { nombre: "Chañaral", region: "Atacama", alias: ["Chanaral"] },
  { nombre: "Copiapó", region: "Atacama", alias: ["Copiapo"] },
  { nombre: "Diego de Almagro", region: "Atacama", alias: ["Diegoalma"] },
  { nombre: "Freirina", region: "Atacama", alias: [] },
  { nombre: "Huasco", region: "Atacama", alias: [] },
  { nombre: "Tierra Amarilla", region: "Atacama", alias: ["Tierraamarilla"] },
  { nombre: "Vallenar", region: "Atacama", alias: [] },
  { nombre: "Andacollo", region: "Coquimbo", alias: [] },
  { nombre: "Canela", region: "Coquimbo", alias: [] },
  { nombre: "Combarbalá", region: "Coquimbo", alias: ["Combarbala"] },
  { nombre: "Coquimbo", region: "Coquimbo", alias: [] },
  { nombre: "Illapel", region: "Coquimbo", alias: [] },
  { nombre: "La Higuera", region: "Coquimbo", alias: ["Lahiguera"] },
  { nombre: "La Serena", region: "Coquimbo", alias: ["Laserena"] },
  { nombre: "Los Vilos", region: "Coquimbo", alias: ["Losvilos"] },
  { nombre: "Monte Patria", region: "Coquimbo", alias: ["Montepatria"] },
  { nombre: "Ovalle", region: "Coquimbo", alias: [] },
  { nombre: "Paiguano", region: "Coquimbo", alias: [] },
  { nombre: "Punitaqui", region: "Coquimbo", alias: [] },
  { nombre: "Río Hurtado", region: "Coquimbo", alias: ["Riohurtado", "Rio Hurtado"] },
  { nombre: "Salamanca", region: "Coquimbo", alias: [] },
  { nombre: "Vicuña", region: "Coquimbo", alias: ["Vicuña"] },
  { nombre: "Algarrobo", region: "Valparaíso", alias: [] },
  { nombre: "Cabildo", region: "Valparaíso", alias: [] },
  { nombre: "Calera", region: "Valparaíso", alias: [] },
  { nombre: "Calle Larga", region: "Valparaíso", alias: ["Callelarga"] },
  { nombre: "Cartagena", region: "Valparaíso", alias: [] },
  { nombre: "Casablanca", region: "Valparaíso", alias: [] },
  { nombre: "Catemu", region: "Valparaíso", alias: [] },
  { nombre: "Concón", region: "Valparaíso", alias: ["Concon"] },
  { nombre: "El Quisco", region: "Valparaíso", alias: ["Elquisco"] },
  { nombre: "El Tabo", region: "Valparaíso", alias: ["Eltabo"] },
  { nombre: "Hijuelas", region: "Valparaíso", alias: [] },
  { nombre: "Isla de Pascua", region: "Valparaíso", alias: ["Isla Pascua", "Rapa Nui"] },
  { nombre: "Juan Fernández", region: "Valparaíso", alias: ["Juanfernandez"] },
  { nombre: "La Cruz", region: "Valparaíso", alias: ["Lacruz"] },
  { nombre: "La Ligua", region: "Valparaíso", alias: ["Laligua"] },
  { nombre: "Limache", region: "Valparaíso", alias: [] },
  { nombre: "Llaillay", region: "Valparaíso", alias: [] },
  { nombre: "Los Andes", region: "Valparaíso", alias: ["Losandes"] },
  { nombre: "Nogales", region: "Valparaíso", alias: [] },
  { nombre: "Olmué", region: "Valparaíso", alias: ["Olmue"] },
  { nombre: "Panquehue", region: "Valparaíso", alias: [] },
  { nombre: "Papudo", region: "Valparaíso", alias: [] },
  { nombre: "Petorca", region: "Valparaíso", alias: [] },
  { nombre: "Puchuncaví", region: "Valparaíso", alias: ["Puchuncavi"] },
  { nombre: "Putaendo", region: "Valparaíso", alias: [] },
  { nombre: "Quillota", region: "Valparaíso", alias: [] },
  { nombre: "Quilpué", region: "Valparaíso", alias: ["Quilpue"] },
  { nombre: "Quintero", region: "Valparaíso", alias: [] },
  { nombre: "Rinconada", region: "Valparaíso", alias: [] },
  { nombre: "San Esteban", region: "Valparaíso", alias: ["Sanesteban"] },
  { nombre: "San Felipe", region: "Valparaíso", alias: ["Sanfelipe"] },
  { nombre: "Santa María", region: "Valparaíso", alias: ["Santamaria"] },
  { nombre: "Santo Domingo", region: "Valparaíso", alias: ["Santodomingo"] },
  { nombre: "Valparaíso", region: "Valparaíso", alias: ["Valparaiso", "Valpo", "Vap"] },
  { nombre: "Villa Alemana", region: "Valparaíso", alias: ["Villaalemana"] },
  { nombre: "Viña del Mar", region: "Valparaíso", alias: ["Vina del Mar", "VdM", "Viña", "Vina"] },
  { nombre: "Zapallar", region: "Valparaíso", alias: [] },
  { nombre: "Codegua", region: "O'Higgins", alias: [] },
  { nombre: "Coinco", region: "O'Higgins", alias: [] },
  { nombre: "Coltauco", region: "O'Higgins", alias: [] },
  { nombre: "Doñihue", region: "O'Higgins", alias: ["Donihue"] },
  { nombre: "Graneros", region: "O'Higgins", alias: [] },
  { nombre: "Las Cabras", region: "O'Higgins", alias: ["Lascabras"] },
  { nombre: "Litueche", region: "O'Higgins", alias: [] },
  { nombre: "Lolol", region: "O'Higgins", alias: [] },
  { nombre: "Machalí", region: "O'Higgins", alias: ["Machali"] },
  { nombre: "Malloa", region: "O'Higgins", alias: [] },
  { nombre: "Mostazal", region: "O'Higgins", alias: [] },
  { nombre: "Navidad", region: "O'Higgins", alias: [] },
  { nombre: "Olivar", region: "O'Higgins", alias: [] },
  { nombre: "Palmilla", region: "O'Higgins", alias: [] },
  { nombre: "Paredones", region: "O'Higgins", alias: [] },
  { nombre: "Peralillo", region: "O'Higgins", alias: [] },
  { nombre: "Peumo", region: "O'Higgins", alias: [] },
  { nombre: "Pichidegua", region: "O'Higgins", alias: [] },
  { nombre: "Pichilemu", region: "O'Higgins", alias: [] },
  { nombre: "Placilla", region: "O'Higgins", alias: [] },
  { nombre: "Pumanque", region: "O'Higgins", alias: [] },
  { nombre: "Quinta de Tilcoco", region: "O'Higgins", alias: ["Quintadtilcoco"] },
  { nombre: "Rancagua", region: "O'Higgins", alias: [] },
  { nombre: "Rengo", region: "O'Higgins", alias: [] },
  { nombre: "Requínoa", region: "O'Higgins", alias: ["Requinoa"] },
  { nombre: "San Fernando", region: "O'Higgins", alias: ["Sanfernando"] },
  { nombre: "San Vicente", region: "O'Higgins", alias: ["Sanvicente"] },
  { nombre: "Chépica", region: "O'Higgins", alias: ["Chepica"] },
  { nombre: "Chimbarongo", region: "O'Higgins", alias: [] },
  { nombre: "Chanco", region: "Maule", alias: [] },
  { nombre: "Colbún", region: "Maule", alias: ["Colbun"] },
  { nombre: "Constitución", region: "Maule", alias: [] },
  { nombre: "Curepto", region: "Maule", alias: [] },
  { nombre: "Curicó", region: "Maule", alias: ["Curico"] },
  { nombre: "Empedrado", region: "Maule", alias: [] },
  { nombre: "Hualañé", region: "Maule", alias: ["Hualane"] },
  { nombre: "Licantén", region: "Maule", alias: ["Licanten"] },
  { nombre: "Linares", region: "Maule", alias: [] },
  { nombre: "Longaví", region: "Maule", alias: ["Longavi"] },
  { nombre: "Maule", region: "Maule", alias: [] },
  { nombre: "Molina", region: "Maule", alias: [] },
  { nombre: "Parral", region: "Maule", alias: [] },
  { nombre: "Pelarco", region: "Maule", alias: [] },
  { nombre: "Pelluhue", region: "Maule", alias: [] },
  { nombre: "Pencahue", region: "Maule", alias: [] },
  { nombre: "Rauco", region: "Maule", alias: [] },
  { nombre: "Retiro", region: "Maule", alias: [] },
  { nombre: "Romeral", region: "Maule", alias: [] },
  { nombre: "Río Claro", region: "Maule", alias: ["Rioclara", "Rio Claro"] },
  { nombre: "Sagrada Familia", region: "Maule", alias: ["Sagradafamilia"] },
  { nombre: "San Clemente", region: "Maule", alias: ["Sanclemente"] },
  { nombre: "San Javier", region: "Maule", alias: ["Sanjavier"] },
  { nombre: "San Rafael", region: "Maule", alias: ["Sanrafael"] },
  { nombre: "Talca", region: "Maule", alias: [] },
  { nombre: "Teno", region: "Maule", alias: [] },
  { nombre: "Vichuquén", region: "Maule", alias: ["Vichuquen"] },
  { nombre: "Villa Alegre", region: "Maule", alias: ["Villaalegre"] },
  { nombre: "Yerbas Buenas", region: "Maule", alias: ["Yerbasbuenas"] },
  { nombre: "Alto Biobío", region: "Biobío", alias: ["Altobiobio"] },
  { nombre: "Antuco", region: "Biobío", alias: [] },
  { nombre: "Arauco", region: "Biobío", alias: [] },
  { nombre: "Cabrero", region: "Biobío", alias: [] },
  { nombre: "Cañete", region: "Biobío", alias: ["Canete"] },
  { nombre: "Chiguayante", region: "Biobío", alias: [] },
  { nombre: "Concepción", region: "Biobío", alias: ["Conce", "Concepc"] },
  { nombre: "Contulmo", region: "Biobío", alias: [] },
  { nombre: "Coronel", region: "Biobío", alias: [] },
  { nombre: "Curanilahue", region: "Biobío", alias: [] },
  { nombre: "Florida", region: "Biobío", alias: [] },
  { nombre: "Hualpén", region: "Biobío", alias: ["Hualpen"] },
  { nombre: "Hualqui", region: "Biobío", alias: [] },
  { nombre: "Laja", region: "Biobío", alias: [] },
  { nombre: "Lebu", region: "Biobío", alias: [] },
  { nombre: "Los Álamos", region: "Biobío", alias: ["Los Alamos", "Losalamos"] },
  { nombre: "Los Ángeles", region: "Biobío", alias: ["Los Angeles", "Losangeles"] },
  { nombre: "Lota", region: "Biobío", alias: [] },
  { nombre: "Mulchén", region: "Biobío", alias: ["Mulchen"] },
  { nombre: "Nacimiento", region: "Biobío", alias: [] },
  { nombre: "Negrete", region: "Biobío", alias: [] },
  { nombre: "Penco", region: "Biobío", alias: [] },
  { nombre: "Quilaco", region: "Biobío", alias: [] },
  { nombre: "Quilleco", region: "Biobío", alias: [] },
  { nombre: "San Pedro de la Paz", region: "Biobío", alias: ["Sanpedro", "San Pedro"] },
  { nombre: "San Rosendo", region: "Biobío", alias: ["Sanrosendo"] },
  { nombre: "Santa Bárbara", region: "Biobío", alias: ["Santa Barbara", "Santabarbara"] },
  { nombre: "Santa Juana", region: "Biobío", alias: ["Santajuana"] },
  { nombre: "Talcahuano", region: "Biobío", alias: [] },
  { nombre: "Tirúa", region: "Biobío", alias: ["Tirua"] },
  { nombre: "Tomé", region: "Biobío", alias: ["Tome"] },
  { nombre: "Tucapel", region: "Biobío", alias: [] },
  { nombre: "Yumbel", region: "Biobío", alias: [] },
  { nombre: "Angol", region: "La Araucanía", alias: [] },
  { nombre: "Carahue", region: "La Araucanía", alias: [] },
  { nombre: "Cholchol", region: "La Araucanía", alias: [] },
  { nombre: "Collipulli", region: "La Araucanía", alias: [] },
  { nombre: "Cunco", region: "La Araucanía", alias: [] },
  { nombre: "Curacautín", region: "La Araucanía", alias: ["Curacautin"] },
  { nombre: "Curarrehue", region: "La Araucanía", alias: [] },
  { nombre: "Ercilla", region: "La Araucanía", alias: [] },
  { nombre: "Freire", region: "La Araucanía", alias: [] },
  { nombre: "Galvarino", region: "La Araucanía", alias: [] },
  { nombre: "Gorbea", region: "La Araucanía", alias: [] },
  { nombre: "Lautaro", region: "La Araucanía", alias: [] },
  { nombre: "Loncoche", region: "La Araucanía", alias: [] },
  { nombre: "Lonquimay", region: "La Araucanía", alias: [] },
  { nombre: "Los Sauces", region: "La Araucanía", alias: ["Lossauces"] },
  { nombre: "Lumaco", region: "La Araucanía", alias: [] },
  { nombre: "Melipeuco", region: "La Araucanía", alias: [] },
  { nombre: "Nueva Imperial", region: "La Araucanía", alias: ["Nuevaimperial"] },
  { nombre: "Padre Las Casas", region: "La Araucanía", alias: ["Padrelascasas"] },
  { nombre: "Perquenco", region: "La Araucanía", alias: [] },
  { nombre: "Pitrufquén", region: "La Araucanía", alias: ["Pitrufquen"] },
  { nombre: "Pucón", region: "La Araucanía", alias: ["Pucon"] },
  { nombre: "Purén", region: "La Araucanía", alias: ["Puren"] },
  { nombre: "Renaico", region: "La Araucanía", alias: [] },
  { nombre: "Saavedra", region: "La Araucanía", alias: [] },
  { nombre: "Temuco", region: "La Araucanía", alias: [] },
  { nombre: "Teodoro Schmidt", region: "La Araucanía", alias: ["Teodoroschmidt"] },
  { nombre: "Toltén", region: "La Araucanía", alias: ["Tolten"] },
  { nombre: "Traiguén", region: "La Araucanía", alias: ["Traiguen"] },
  { nombre: "Victoria", region: "La Araucanía", alias: [] },
  { nombre: "Vilcún", region: "La Araucanía", alias: ["Vilcun"] },
  { nombre: "Villarrica", region: "La Araucanía", alias: [] },
  { nombre: "Ancud", region: "Los Lagos", alias: [] },
  { nombre: "Calbuco", region: "Los Lagos", alias: [] },
  { nombre: "Castro", region: "Los Lagos", alias: [] },
  { nombre: "Chaitén", region: "Los Lagos", alias: ["Chaiten"] },
  { nombre: "Chonchi", region: "Los Lagos", alias: [] },
  { nombre: "Cochamó", region: "Los Lagos", alias: ["Cochamo"] },
  { nombre: "Curaco de Vélez", region: "Los Lagos", alias: ["Curacodevelez"] },
  { nombre: "Dalcahue", region: "Los Lagos", alias: [] },
  { nombre: "Fresia", region: "Los Lagos", alias: [] },
  { nombre: "Frutillar", region: "Los Lagos", alias: [] },
  { nombre: "Futaleufú", region: "Los Lagos", alias: ["Futaleufu"] },
  { nombre: "Hualaihué", region: "Los Lagos", alias: ["Hualaihue"] },
  { nombre: "Llanquihue", region: "Los Lagos", alias: [] },
  { nombre: "Los Muermos", region: "Los Lagos", alias: ["Losmuermos"] },
  { nombre: "Maullín", region: "Los Lagos", alias: ["Maullin"] },
  { nombre: "Osorno", region: "Los Lagos", alias: [] },
  { nombre: "Palena", region: "Los Lagos", alias: [] },
  { nombre: "Puerto Montt", region: "Los Lagos", alias: ["PtoMontt", "Pto Montt"] },
  { nombre: "Puerto Octay", region: "Los Lagos", alias: ["Puertooctay"] },
  { nombre: "Puerto Varas", region: "Los Lagos", alias: ["Puertovaras"] },
  { nombre: "Puqueldón", region: "Los Lagos", alias: ["Puqueldon"] },
  { nombre: "Purranque", region: "Los Lagos", alias: [] },
  { nombre: "Puyehue", region: "Los Lagos", alias: [] },
  { nombre: "Queilén", region: "Los Lagos", alias: ["Quilen"] },
  { nombre: "Quellón", region: "Los Lagos", alias: ["Quellon"] },
  { nombre: "Quemchi", region: "Los Lagos", alias: [] },
  { nombre: "Quinchao", region: "Los Lagos", alias: [] },
  { nombre: "Río Negro", region: "Los Lagos", alias: ["Rionegro", "Rio Negro"] },
  { nombre: "San Juan de la Costa", region: "Los Lagos", alias: ["Sanjuandelacosta"] },
  { nombre: "San Pablo", region: "Los Lagos", alias: ["Sanpablo"] },
  { nombre: "Coihaique", region: "Aysén", alias: ["Coyhaique"] },
  { nombre: "Aysén", region: "Aysén", alias: ["Aysen"] },
  { nombre: "Chile Chico", region: "Aysén", alias: ["Chilechico"] },
  { nombre: "Cisnes", region: "Aysén", alias: [] },
  { nombre: "Guaitecas", region: "Aysén", alias: [] },
  { nombre: "Lago Verde", region: "Aysén", alias: ["Lagoverde"] },
  { nombre: "O'Higgins", region: "Aysén", alias: ["OHiggins Aysen"] },
  { nombre: "Río Ibáñez", region: "Aysén", alias: ["Rioibanez", "Rio Ibañez"] },
  { nombre: "Tor", region: "Aysén", alias: ["Tor"] },
  { nombre: "Antártica", region: "Magallanes", alias: [] },
  { nombre: "Cabo de Hornos", region: "Magallanes", alias: ["Cabodehornos"] },
  { nombre: "Laguna Blanca", region: "Magallanes", alias: ["Lagunablanca"] },
  { nombre: "Natales", region: "Magallanes", alias: [] },
  { nombre: "Porvenir", region: "Magallanes", alias: [] },
  { nombre: "Primavera", region: "Magallanes", alias: [] },
  { nombre: "Punta Arenas", region: "Magallanes", alias: ["PtaArenas", "Pta Arenas"] },
  { nombre: "Río Verde", region: "Magallanes", alias: ["Rioverde", "Rio Verde"] },
  { nombre: "San Gregorio", region: "Magallanes", alias: ["Sangregorio"] },
  { nombre: "Timaukel", region: "Magallanes", alias: [] },
  { nombre: "Tor", region: "Magallanes", alias: ["Tor"] },
  { nombre: "Cerrillos", region: "Región Metropolitana", alias: [] },
  { nombre: "Cerro Navia", region: "Región Metropolitana", alias: ["Cerronav"] },
  { nombre: "Colina", region: "Región Metropolitana", alias: [] },
  { nombre: "Conchalí", region: "Región Metropolitana", alias: ["Conchali"] },
  { nombre: "Curacaví", region: "Región Metropolitana", alias: ["Curacavi"] },
  { nombre: "El Bosque", region: "Región Metropolitana", alias: ["Elbosque"] },
  { nombre: "El Monte", region: "Región Metropolitana", alias: ["Elmonte"] },
  { nombre: "Estación Central", region: "Región Metropolitana", alias: ["Estacioncentral"] },
  { nombre: "Huechuraba", region: "Región Metropolitana", alias: [] },
  { nombre: "Independencia", region: "Región Metropolitana", alias: [] },
  { nombre: "Isla de Maipo", region: "Región Metropolitana", alias: ["Islademaipo"] },
  { nombre: "La Cisterna", region: "Región Metropolitana", alias: ["Lacisterna"] },
  { nombre: "La Florida", region: "Región Metropolitana", alias: ["Laflorida"] },
  { nombre: "La Granja", region: "Región Metropolitana", alias: ["Lagranja"] },
  { nombre: "La Pintana", region: "Región Metropolitana", alias: ["Lapintana"] },
  { nombre: "La Reina", region: "Región Metropolitana", alias: ["Lareina"] },
  { nombre: "Lampa", region: "Región Metropolitana", alias: [] },
  { nombre: "Las Condes", region: "Región Metropolitana", alias: ["Lascondes"] },
  { nombre: "Lo Barnechea", region: "Región Metropolitana", alias: ["Lobarnechea"] },
  { nombre: "Lo Espejo", region: "Región Metropolitana", alias: ["Loespejo"] },
  { nombre: "Lo Prado", region: "Región Metropolitana", alias: ["Loprado"] },
  { nombre: "Macul", region: "Región Metropolitana", alias: [] },
  { nombre: "Maipú", region: "Región Metropolitana", alias: ["Maipu"] },
  { nombre: "María Pinto", region: "Región Metropolitana", alias: ["Mariapinto"] },
  { nombre: "Melipilla", region: "Región Metropolitana", alias: [] },
  { nombre: "Ñuñoa", region: "Región Metropolitana", alias: ["Nunoa"] },
  { nombre: "Padre Hurtado", region: "Región Metropolitana", alias: ["Padrehurtado", "PdteHurtado"] },
  { nombre: "Paine", region: "Región Metropolitana", alias: [] },
  { nombre: "Pedro Aguirre Cerda", region: "Región Metropolitana", alias: ["Pedroaguirrecerda", "PAC"] },
  { nombre: "Peñaflor", region: "Región Metropolitana", alias: ["Penaflor"] },
  { nombre: "Peñalolén", region: "Región Metropolitana", alias: ["Penalolen"] },
  { nombre: "Pirque", region: "Región Metropolitana", alias: [] },
  { nombre: "Providencia", region: "Región Metropolitana", alias: [] },
  { nombre: "Pudahuel", region: "Región Metropolitana", alias: [] },
  { nombre: "Puente Alto", region: "Región Metropolitana", alias: ["Puentealto"] },
  { nombre: "Quilicura", region: "Región Metropolitana", alias: [] },
  { nombre: "Quinta Normal", region: "Región Metropolitana", alias: ["Quintanormal"] },
  { nombre: "Recoleta", region: "Región Metropolitana", alias: [] },
  { nombre: "Renca", region: "Región Metropolitana", alias: [] },
  { nombre: "San Bernardo", region: "Región Metropolitana", alias: ["SnBdo", "S.Bernardo", "Sanbernardo"] },
  { nombre: "San Joaquín", region: "Región Metropolitana", alias: ["Sanjoaquin"] },
  { nombre: "San José de Maipo", region: "Región Metropolitana", alias: ["Sanjosedemaipo"] },
  { nombre: "San Miguel", region: "Región Metropolitana", alias: ["Sanmiguel"] },
  { nombre: "San Pedro", region: "Región Metropolitana", alias: ["Sanpedro"] },
  { nombre: "San Ramón", region: "Región Metropolitana", alias: ["Sanramon"] },
  { nombre: "Santiago", region: "Región Metropolitana", alias: ["Stgo", "Stgo.", "Santiago Centro", "Centro"] },
  { nombre: "Talagante", region: "Región Metropolitana", alias: [] },
  { nombre: "Tiltil", region: "Región Metropolitana", alias: [] },
  { nombre: "Vitacura", region: "Región Metropolitana", alias: [] },
  { nombre: "Alhué", region: "Región Metropolitana", alias: ["Alhue"] },
  { nombre: "Buin", region: "Región Metropolitana", alias: [] },
  { nombre: "Calera de Tango", region: "Región Metropolitana", alias: ["Caleradetango"] },
  { nombre: "Coronel", region: "Región Metropolitana", alias: [] },
  { nombre: "Lampa", region: "Región Metropolitana", alias: [] },
  { nombre: "Arica", region: "Los Ríos", alias: [] },
  { nombre: "Corral", region: "Los Ríos", alias: [] },
  { nombre: "Futrono", region: "Los Ríos", alias: [] },
  { nombre: "La Unión", region: "Los Ríos", alias: ["Launion"] },
  { nombre: "Lago Ranco", region: "Los Ríos", alias: ["Lagoranco"] },
  { nombre: "Lanco", region: "Los Ríos", alias: [] },
  { nombre: "Los Lagos", region: "Los Ríos", alias: ["Loslagos"] },
  { nombre: "Máfil", region: "Los Ríos", alias: ["Mafil"] },
  { nombre: "Mariquina", region: "Los Ríos", alias: [] },
  { nombre: "Paillaco", region: "Los Ríos", alias: [] },
  { nombre: "Panguipulli", region: "Los Ríos", alias: [] },
  { nombre: "Río Bueno", region: "Los Ríos", alias: ["Riobueno", "Rio Bueno"] },
  { nombre: "Valdivia", region: "Los Ríos", alias: [] },
  { nombre: "Bulnes", region: "Ñuble", alias: [] },
  { nombre: "Chillán", region: "Ñuble", alias: ["Chillan"] },
  { nombre: "Chillán Viejo", region: "Ñuble", alias: ["Chillanviejo", "Chillán Viejo"] },
  { nombre: "Cobquecura", region: "Ñuble", alias: [] },
  { nombre: "Coelemu", region: "Ñuble", alias: [] },
  { nombre: "Coihueco", region: "Ñuble", alias: [] },
  { nombre: "El Carmen", region: "Ñuble", alias: ["Elcarmen"] },
  { nombre: "Ninhue", region: "Ñuble", alias: [] },
  { nombre: "Ñiquén", region: "Ñuble", alias: ["Niquen"] },
  { nombre: "Pemuco", region: "Ñuble", alias: [] },
  { nombre: "Pinto", region: "Ñuble", alias: [] },
  { nombre: "Portezuelo", region: "Ñuble", alias: [] },
  { nombre: "Quillón", region: "Ñuble", alias: ["Quillon"] },
  { nombre: "Quirihue", region: "Ñuble", alias: [] },
  { nombre: "Ránquil", region: "Ñuble", alias: ["Ranquil"] },
  { nombre: "San Carlos", region: "Ñuble", alias: ["Sancarlos"] },
  { nombre: "San Fabián", region: "Ñuble", alias: ["Sanfabian"] },
  { nombre: "San Ignacio", region: "Ñuble", alias: ["Sanignacio"] },
  { nombre: "San Nicolás", region: "Ñuble", alias: ["Sannicolas"] },
  { nombre: "Treguaco", region: "Ñuble", alias: [] },
  { nombre: "Yungay", region: "Ñuble", alias: [] },
];

export function normalizeComunaName(input: string): string | null {
  const cleaned = input.trim().toLowerCase();
  for (const comuna of COMUNAS) {
    if (comuna.nombre.toLowerCase() === cleaned) return comuna.nombre;
    for (const alias of comuna.alias) {
      if (alias.toLowerCase() === cleaned) return comuna.nombre;
    }
  }
  return null;
}

export function findComunaByRegion(region: string): string[] {
  return COMUNAS.filter((c) => c.region === region).map((c) => c.nombre);
}

export function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function fuzzyMatchComuna(input: string, maxDistance = 2): string | null {
  const cleaned = input.trim().toLowerCase().replace(/[.\s]+/g, "");
  let bestMatch: string | null = null;
  let bestDist = maxDistance + 1;
  for (const comuna of COMUNAS) {
    const name = comuna.nombre.toLowerCase().replace(/[.\s]+/g, "");
    const dist = levenshtein(cleaned, name);
    if (dist <= maxDistance && dist < bestDist) {
      bestDist = dist;
      bestMatch = comuna.nombre;
    }
    for (const alias of comuna.alias) {
      const aliasNorm = alias.toLowerCase().replace(/[.\s]+/g, "");
      const aliasDist = levenshtein(cleaned, aliasNorm);
      if (aliasDist <= maxDistance && aliasDist < bestDist) {
        bestDist = aliasDist;
        bestMatch = comuna.nombre;
      }
    }
  }
  return bestMatch;
}

export function fuzzyMatchRegion(input: string, maxDistance = 2): string | null {
  const cleaned = input.trim().toLowerCase().replace(/[.\s]+/g, "");
  let bestMatch: string | null = null;
  let bestDist = maxDistance + 1;
  for (const region of REGIONES) {
    const name = region.nombre.toLowerCase().replace(/[.\s]+/g, "");
    const dist = levenshtein(cleaned, name);
    if (dist <= maxDistance && dist < bestDist) {
      bestDist = dist;
      bestMatch = region.nombre;
    }
    if (region.romano.toLowerCase() === cleaned) return region.nombre;
    for (const alias of region.alias) {
      const aliasNorm = alias.toLowerCase().replace(/[.\s]+/g, "");
      const aliasDist = levenshtein(cleaned, aliasNorm);
      if (aliasDist <= maxDistance && aliasDist < bestDist) {
        bestDist = aliasDist;
        bestMatch = region.nombre;
      }
    }
  }
  return bestMatch;
}
