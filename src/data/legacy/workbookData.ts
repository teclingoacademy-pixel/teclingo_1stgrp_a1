/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * workbookData.ts
 * Constantes de datos heredadas. Consumidas como fallback por algunas vistas.
 */

import type {
  SheetClaseRow, SheetTextoBaseRow, SheetVocabularioRow,
  SheetProgresoUsuarioRow, SheetResumenProgresoRow, SheetUsuarioRow,
} from '@/types/workbook/workbookRows';

export type {
  SheetReactivoRow, SheetClaseRow, SheetTextoBaseRow, SheetVocabularioRow,
  SheetProgresoUsuarioRow, SheetResumenProgresoRow, SheetUsuarioRow,
} from '@/types/workbook/workbookRows';

export const INITIAL_VOCABULARIO: SheetVocabularioRow[] = [
  // A1_C01: Pronombres Personales (7 tarjetas)
  { vocab_id: "A1_C01_V01", clase_id: "A1_C01", palabra_ingles: "I", palabra_espanol: "yo", categoria: "pronombre", pronunciacion_af: "/aɪ/", audio_url: "https://assets.teclingo.com/audio/I.mp3", ejemplo_uso: "I am a student.", dificultad: 1 },
  { vocab_id: "A1_C01_V02", clase_id: "A1_C01", palabra_ingles: "you", palabra_espanol: "tú / usted", categoria: "pronombre", pronunciacion_af: "/juː/", audio_url: "https://assets.teclingo.com/audio/you.mp3", ejemplo_uso: "You are my friend.", dificultad: 1 },
  { vocab_id: "A1_C01_V03", clase_id: "A1_C01", palabra_ingles: "he", palabra_espanol: "él", categoria: "pronombre", pronunciacion_af: "/hiː/", audio_url: "https://assets.teclingo.com/audio/he.mp3", ejemplo_uso: "He is a teacher.", dificultad: 1 },
  { vocab_id: "A1_C01_V04", clase_id: "A1_C01", palabra_ingles: "she", palabra_espanol: "ella", categoria: "pronombre", pronunciacion_af: "/ʃiː/", audio_url: "https://assets.teclingo.com/audio/she.mp3", ejemplo_uso: "She is Maria.", dificultad: 1 },
  { vocab_id: "A1_C01_V05", clase_id: "A1_C01", palabra_ingles: "it", palabra_espanol: "eso / ello", categoria: "pronombre", pronunciacion_af: "/ɪt/", audio_url: "https://assets.teclingo.com/audio/it.mp3", ejemplo_uso: "It is a book.", dificultad: 1 },
  { vocab_id: "A1_C01_V06", clase_id: "A1_C01", palabra_ingles: "we", palabra_espanol: "nosotros", categoria: "pronombre", pronunciacion_af: "/wiː/", audio_url: "https://assets.teclingo.com/audio/we.mp3", ejemplo_uso: "We are friends.", dificultad: 1 },
  { vocab_id: "A1_C01_V07", clase_id: "A1_C01", palabra_ingles: "they", palabra_espanol: "ellos", categoria: "pronombre", pronunciacion_af: "/ðeɪ/", audio_url: "https://assets.teclingo.com/audio/they.mp3", ejemplo_uso: "They are students.", dificultad: 1 },

  // A1_C01: Sustantivos Clave (7 tarjetas)
  { vocab_id: "A1_C01_V08", clase_id: "A1_C01", palabra_ingles: "student", palabra_espanol: "estudiante", categoria: "sustantivo", pronunciacion_af: "/ˈstjuːdənt/", audio_url: "https://assets.teclingo.com/audio/student.mp3", ejemplo_uso: "One student is here.", dificultad: 1 },
  { vocab_id: "A1_C01_V09", clase_id: "A1_C01", palabra_ingles: "students", palabra_espanol: "estudiantes", categoria: "sustantivo", pronunciacion_af: "/ˈstjuːdənts/", audio_url: "https://assets.teclingo.com/audio/students.mp3", ejemplo_uso: "Many students are here.", dificultad: 1 },
  { vocab_id: "A1_C01_V10", clase_id: "A1_C01", palabra_ingles: "book", palabra_espanol: "libro", categoria: "sustantivo", pronunciacion_af: "/bʊk/", audio_url: "https://assets.teclingo.com/audio/book.mp3", ejemplo_uso: "One book is here.", dificultad: 1 },
  { vocab_id: "A1_C01_V11", clase_id: "A1_C01", palabra_ingles: "books", palabra_espanol: "libros", categoria: "sustantivo", pronunciacion_af: "/bʊks/", audio_url: "https://assets.teclingo.com/audio/books.mp3", ejemplo_uso: "Two books are here.", dificultad: 1 },
  { vocab_id: "A1_C01_V12", clase_id: "A1_C01", palabra_ingles: "teacher", palabra_espanol: "profesor", categoria: "sustantivo", pronunciacion_af: "/ˈtiːtʃər/", audio_url: "https://assets.teclingo.com/audio/teacher.mp3", ejemplo_uso: "The teacher is here.", dificultad: 1 },
  { vocab_id: "A1_C01_V13", clase_id: "A1_C01", palabra_ingles: "friend", palabra_espanol: "amigo", categoria: "sustantivo", pronunciacion_af: "/frend/", audio_url: "https://assets.teclingo.com/audio/friend.mp3", ejemplo_uso: "He is my friend.", dificultad: 1 },
  { vocab_id: "A1_C01_V14", clase_id: "A1_C01", palabra_ingles: "classroom", palabra_espanol: "aula", categoria: "sustantivo", pronunciacion_af: "/ˈklɑːsruːm/", audio_url: "https://assets.teclingo.com/audio/classroom.mp3", ejemplo_uso: "We are in the classroom.", dificultad: 1 },
  { vocab_id: "A1_C02_V01", clase_id: "A1_C02", palabra_ingles: "student", palabra_espanol: "estudiante", categoria: "sustantivo", pronunciacion_af: "/ˈstjuːdənt/", audio_url: "https://assets.teclingo.com/audio/student.mp3", ejemplo_uso: "I am a student at the university.", dificultad: 1 },
  { vocab_id: "A1_C02_V02", clase_id: "A1_C02", palabra_ingles: "teacher", palabra_espanol: "profesor(a)", categoria: "sustantivo", pronunciacion_af: "/ˈtiːtʃər/", audio_url: "https://assets.teclingo.com/audio/teacher.mp3", ejemplo_uso: "She is my English teacher.", dificultad: 1 },
  { vocab_id: "A1_C02_V03", clase_id: "A1_C02", palabra_ingles: "doctor", palabra_espanol: "médico/a", categoria: "sustantivo", pronunciacion_af: "/ˈdɒktər/", audio_url: "https://assets.teclingo.com/audio/doctor.mp3", ejemplo_uso: "He is a doctor in Mexico City.", dificultad: 1 },
  { vocab_id: "A1_C02_V04", clase_id: "A1_C02", palabra_ingles: "engineer", palabra_espanol: "ingeniero/a", categoria: "sustantivo", pronunciacion_af: "/ˌɛndʒɪˈnɪər/", audio_url: "https://assets.teclingo.com/audio/engineer.mp3", ejemplo_uso: "We are software engineers.", dificultad: 2 },
  { vocab_id: "A1_C03_V01", clase_id: "A1_C03", palabra_ingles: "happy", palabra_espanol: "feliz", categoria: "adjetivo", pronunciacion_af: "/ˈhæpi/", audio_url: "https://assets.teclingo.com/audio/happy.mp3", ejemplo_uso: "Are you happy today?", dificultad: 1 },
  { vocab_id: "A1_C03_V02", clase_id: "A1_C03", palabra_ingles: "tired", palabra_espanol: "cansado/a", categoria: "adjetivo", pronunciacion_af: "/ˈtaɪərd/", audio_url: "https://assets.teclingo.com/audio/tired.mp3", ejemplo_uso: "I am not tired after work.", dificultad: 1 },
  { vocab_id: "A1_C03_V03", clase_id: "A1_C03", palabra_ingles: "ready", palabra_espanol: "listo/a", categoria: "adjetivo", pronunciacion_af: "/ˈrɛdi/", audio_url: "https://assets.teclingo.com/audio/ready.mp3", ejemplo_uso: "Is the team ready for the lesson?", dificultad: 1 },
  { vocab_id: "A1_C03_V04", clase_id: "A1_C03", palabra_ingles: "busy", palabra_espanol: "ocupado/a", categoria: "adjetivo", pronunciacion_af: "/ˈbɪzi/", audio_url: "https://assets.teclingo.com/audio/busy.mp3", ejemplo_uso: "They aren't busy right now.", dificultad: 1 },
  { vocab_id: "A1_C04_V01", clase_id: "A1_C04", palabra_ingles: "apple", palabra_espanol: "manzana", categoria: "sustantivo", pronunciacion_af: "/ˈæpəl/", audio_url: "https://assets.teclingo.com/audio/apple.mp3", ejemplo_uso: "There are two apples on the desk.", dificultad: 1 },
  { vocab_id: "A1_C04_V02", clase_id: "A1_C04", palabra_ingles: "water", palabra_espanol: "agua", categoria: "sustantivo", pronunciacion_af: "/ˈwɔːtər/", audio_url: "https://assets.teclingo.com/audio/water.mp3", ejemplo_uso: "Do you have some water?", dificultad: 1 },
  { vocab_id: "A1_C04_V03", clase_id: "A1_C04", palabra_ingles: "money", palabra_espanol: "dinero", categoria: "sustantivo", pronunciacion_af: "/ˈmʌni/", audio_url: "https://assets.teclingo.com/audio/money.mp3", ejemplo_uso: "How much money do we need?", dificultad: 1 },
  { vocab_id: "A1_C04_V04", clase_id: "A1_C04", palabra_ingles: "information", palabra_espanol: "información", categoria: "sustantivo", pronunciacion_af: "/ˌɪnfərˈmeɪʃən/", audio_url: "https://assets.teclingo.com/audio/information.mp3", ejemplo_uso: "This information is very useful.", dificultad: 2 },
  { vocab_id: "A1_C05_V01", clase_id: "A1_C05", palabra_ingles: "book", palabra_espanol: "libro", categoria: "sustantivo", pronunciacion_af: "/bʊk/", audio_url: "https://assets.teclingo.com/audio/book.mp3", ejemplo_uso: "This is Maria's book.", dificultad: 1 },
  { vocab_id: "A1_C05_V02", clase_id: "A1_C05", palabra_ingles: "car", palabra_espanol: "carro / auto", categoria: "sustantivo", pronunciacion_af: "/kɑːr/", audio_url: "https://assets.teclingo.com/audio/car.mp3", ejemplo_uso: "John's car is blue.", dificultad: 1 },
  { vocab_id: "A1_C05_V03", clase_id: "A1_C05", palabra_ingles: "house", palabra_espanol: "casa", categoria: "sustantivo", pronunciacion_af: "/haʊs/", audio_url: "https://assets.teclingo.com/audio/house.mp3", ejemplo_uso: "My parents' house is very big.", dificultad: 1 },
  { vocab_id: "A1_C05_V04", clase_id: "A1_C05", palabra_ingles: "laptop", palabra_espanol: "computadora portátil", categoria: "sustantivo", pronunciacion_af: "/ˈlæptɒp/", audio_url: "https://assets.teclingo.com/audio/laptop.mp3", ejemplo_uso: "Is this the teacher's laptop?", dificultad: 1 },
  { vocab_id: "A1_C06_V01", clase_id: "A1_C06", palabra_ingles: "mine", palabra_espanol: "mío / mía", categoria: "pronombre", pronunciacion_af: "/maɪn/", audio_url: "https://assets.teclingo.com/audio/mine.mp3", ejemplo_uso: "That notebook is mine.", dificultad: 1 },
  { vocab_id: "A1_C06_V02", clase_id: "A1_C06", palabra_ingles: "yours", palabra_espanol: "tuyo / tuya", categoria: "pronombre", pronunciacion_af: "/jɔːrz/", audio_url: "https://assets.teclingo.com/audio/yours.mp3", ejemplo_uso: "The coffee on the table is yours.", dificultad: 1 },
  { vocab_id: "A1_C06_V03", clase_id: "A1_C06", palabra_ingles: "theirs", palabra_espanol: "de ellos / de ellas", categoria: "pronombre", pronunciacion_af: "/ðɛərz/", audio_url: "https://assets.teclingo.com/audio/theirs.mp3", ejemplo_uso: "Those project folders are theirs.", dificultad: 2 },
  { vocab_id: "A1_C06_V04", clase_id: "A1_C06", palabra_ingles: "ours", palabra_espanol: "nuestro / nuestra", categoria: "pronombre", pronunciacion_af: "/ˈaʊərz/", audio_url: "https://assets.teclingo.com/audio/ours.mp3", ejemplo_uso: "The success is ours.", dificultad: 2 },
  { vocab_id: "A1_C07_V01", clase_id: "A1_C07", palabra_ingles: "this", palabra_espanol: "este / esta (cerca)", categoria: "pronombre", pronunciacion_af: "/ðɪs/", audio_url: "https://assets.teclingo.com/audio/this.mp3", ejemplo_uso: "This is my favorite phone.", dificultad: 1 },
  { vocab_id: "A1_C07_V02", clase_id: "A1_C07", palabra_ingles: "that", palabra_espanol: "ese / aquel (lejos)", categoria: "pronombre", pronunciacion_af: "/ðæt/", audio_url: "https://assets.teclingo.com/audio/that.mp3", ejemplo_uso: "That building is the library.", dificultad: 1 },
  { vocab_id: "A1_C07_V03", clase_id: "A1_C07", palabra_ingles: "these", palabra_espanol: "estos / estas (cerca)", categoria: "pronombre", pronunciacion_af: "/ðiːz/", audio_url: "https://assets.teclingo.com/audio/these.mp3", ejemplo_uso: "These headphones sound great.", dificultad: 1 },
  { vocab_id: "A1_C07_V04", clase_id: "A1_C07", palabra_ingles: "those", palabra_espanol: "esos / aquellos (lejos)", categoria: "pronombre", pronunciacion_af: "/ðoʊz/", audio_url: "https://assets.teclingo.com/audio/those.mp3", ejemplo_uso: "Those trees are very tall.", dificultad: 1 },
  { vocab_id: "A1_C08_V01", clase_id: "A1_C08", palabra_ingles: "hour", palabra_espanol: "hora (sonido vocal)", categoria: "sustantivo", pronunciacion_af: "/ˈaʊər/", audio_url: "https://assets.teclingo.com/audio/hour.mp3", ejemplo_uso: "We have an hour for lunch.", dificultad: 2 },
  { vocab_id: "A1_C08_V02", clase_id: "A1_C08", palabra_ingles: "university", palabra_espanol: "universidad (sonido consonante /j/)", categoria: "sustantivo", pronunciacion_af: "/ˌjuːnɪˈvɜːrsəti/", audio_url: "https://assets.teclingo.com/audio/university.mp3", ejemplo_uso: "She studies at a university.", dificultad: 2 },
  { vocab_id: "A1_C08_V03", clase_id: "A1_C08", palabra_ingles: "umbrella", palabra_espanol: "paraguas", categoria: "sustantivo", pronunciacion_af: "/ʌmˈbrɛlə/", audio_url: "https://assets.teclingo.com/audio/umbrella.mp3", ejemplo_uso: "Take an umbrella today.", dificultad: 1 },
  { vocab_id: "A1_C08_V04", clase_id: "A1_C08", palabra_ingles: "hotel", palabra_espanol: "hotel", categoria: "sustantivo", pronunciacion_af: "/hoʊˈtɛl/", audio_url: "https://assets.teclingo.com/audio/hotel.mp3", ejemplo_uso: "They stay at a quiet hotel.", dificultad: 1 },
  { vocab_id: "A1_C09_V01", clase_id: "A1_C09", palabra_ingles: "brother", palabra_espanol: "hermano", categoria: "sustantivo", pronunciacion_af: "/ˈbrʌðər/", audio_url: "https://assets.teclingo.com/audio/brother.mp3", ejemplo_uso: "I have one brother.", dificultad: 1 },
  { vocab_id: "A1_C09_V02", clase_id: "A1_C09", palabra_ingles: "sister", palabra_espanol: "hermana", categoria: "sustantivo", pronunciacion_af: "/ˈsɪstər/", audio_url: "https://assets.teclingo.com/audio/sister.mp3", ejemplo_uso: "She has two sisters.", dificultad: 1 },
  { vocab_id: "A1_C09_V03", clase_id: "A1_C09", palabra_ingles: "pet", palabra_espanol: "mascota", categoria: "sustantivo", pronunciacion_af: "/pɛt/", audio_url: "https://assets.teclingo.com/audio/pet.mp3", ejemplo_uso: "Do you have any pets?", dificultad: 1 },
  { vocab_id: "A1_C09_V04", clase_id: "A1_C09", palabra_ingles: "family", palabra_espanol: "familia", categoria: "sustantivo", pronunciacion_af: "/ˈfæmɪli/", audio_url: "https://assets.teclingo.com/audio/family.mp3", ejemplo_uso: "We have a wonderful family.", dificultad: 1 },
  { vocab_id: "A1_C10_V01", clase_id: "A1_C10", palabra_ingles: "always", palabra_espanol: "siempre (100%)", categoria: "adverbio", pronunciacion_af: "/ˈɔːlweɪz/", audio_url: "https://assets.teclingo.com/audio/always.mp3", ejemplo_uso: "He always works hard.", dificultad: 1 },
  { vocab_id: "A1_C10_V02", clase_id: "A1_C10", palabra_ingles: "usually", palabra_espanol: "usualmente (80%)", categoria: "adverbio", pronunciacion_af: "/ˈjuːʒuəli/", audio_url: "https://assets.teclingo.com/audio/usually.mp3", ejemplo_uso: "She usually drinks tea in the morning.", dificultad: 1 },
  { vocab_id: "A1_C10_V03", clase_id: "A1_C10", palabra_ingles: "sometimes", palabra_espanol: "a veces (50%)", categoria: "adverbio", pronunciacion_af: "/ˈsʌmtaɪmz/", audio_url: "https://assets.teclingo.com/audio/sometimes.mp3", ejemplo_uso: "We sometimes study together.", dificultad: 1 },
  { vocab_id: "A1_C10_V04", clase_id: "A1_C10", palabra_ingles: "never", palabra_espanol: "nunca (0%)", categoria: "adverbio", pronunciacion_af: "/ˈnɛvər/", audio_url: "https://assets.teclingo.com/audio/never.mp3", ejemplo_uso: "He never arrives late.", dificultad: 1 },
  { vocab_id: "A1_C11_V01", clase_id: "A1_C11", palabra_ingles: "breakfast", palabra_espanol: "desayuno", categoria: "sustantivo", pronunciacion_af: "/ˈbrɛkfəst/", audio_url: "https://assets.teclingo.com/audio/breakfast.mp3", ejemplo_uso: "Do you eat breakfast every day?", dificultad: 1 },
  { vocab_id: "A1_C11_V02", clase_id: "A1_C11", palabra_ingles: "routine", palabra_espanol: "rutina", categoria: "sustantivo", pronunciacion_af: "/ruːˈtiːn/", audio_url: "https://assets.teclingo.com/audio/routine.mp3", ejemplo_uso: "My morning routine is very simple.", dificultad: 1 },
];

export const INITIAL_CLASES: SheetClaseRow[] = [
  { clase_id: "A1_C01", clase_numero: 1, semana: 1, sesion: "A", titulo_clase: "Clase 01: Fase Cero - Singular & Plural", titulo_video: "FASE CERO TECLINGO: El Secreto de los Singulares y Plurales", video_url: "https://youtube.com/shorts/JBB6JZT4VIc?si=Pz1xbJ-YOJpAWmpQ", tema_principal: "La Regla de Oro del Inglés: YOU siempre es plural", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C02", clase_numero: 2, semana: 1, sesion: "B", titulo_clase: "Clase 01: Verbo To Be Presente (Afirmativo)", titulo_video: "CLASE 01 TECLINGO: Dominando el Verbo To Be", video_url: "https://youtube.com/shorts/4yQeI0N2j2o?si=Qv67iR_9p84y5d_y", tema_principal: "Verbo To Be, Pronombres Personales, Ser/Estar", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C03", clase_numero: 3, semana: 2, sesion: "A", titulo_clase: "Clase 02: Verbo To Be (Negativo & Preguntas)", titulo_video: "CLASE 02: Preguntas y Negaciones sin Miedo", video_url: "https://youtube.com/shorts/6-8nL7pW9mE?si=HjKl88N22bVv11cQ", tema_principal: "To Be Negativo (isn't, aren't), Yes/No Questions", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C04", clase_numero: 4, semana: 2, sesion: "B", titulo_clase: "Clase 03: Sustantivos Contables e Incontables", titulo_video: "CLASE 03: Cómo Contar en Inglés sin Errores", video_url: "https://youtube.com/shorts/3iNk89Lp_0w?si=Ak98Lmk120987654", tema_principal: "Countable & Uncountable, Some, Any, How much/many", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C05", clase_numero: 5, semana: 3, sesion: "A", titulo_clase: "Clase 04: Posesivos y Genitivo Sajón ('s)", titulo_video: "CLASE 04: Dueño + 's + Objeto - Regla de Oro", video_url: "https://youtube.com/shorts/9pLo0Mn34kL?si=OpLkm10982347651", tema_principal: "Genitivo Sajón ('s), My, Your, His, Her", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C06", clase_numero: 6, semana: 3, sesion: "B", titulo_clase: "Clase 05: Pronombres Posesivos vs Adjetivos", titulo_video: "CLASE 05: Mine, Yours, Ours - Nunca los Confundas", video_url: "https://youtube.com/shorts/1qAz2Ws34Ed?si=PlMno09812345678", tema_principal: "Mine, Yours, His, Hers, Ours, Theirs", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C07", clase_numero: 7, semana: 4, sesion: "A", titulo_clase: "Clase 06: Demostrativos: This, That, These, Those", titulo_video: "CLASE 06: Distancia y Número en Inglés Cotidiano", video_url: "https://youtube.com/shorts/5tGb6Yh78Uj?si=Qazwsx1234567890", tema_principal: "Demostrativos de Cercanía y Distancia", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C08", clase_numero: 8, semana: 4, sesion: "B", titulo_clase: "Clase 07: Artículos Indefinidos: A vs AN", titulo_video: "CLASE 07: El Sonido Clave para A y AN", video_url: "https://youtube.com/shorts/8uJm9Kl01Op?si=Wsedrt1234567890", tema_principal: "Artículos Indefinidos, Regla Fonética", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C09", clase_numero: 9, semana: 5, sesion: "A", titulo_clase: "Clase 08: El Verbo Have y Posesión", titulo_video: "CLASE 08: Have vs Has - Usos Esenciales", video_url: "https://youtube.com/shorts/2wSx3Ed45Rf?si=Rfvbgty123456789", tema_principal: "Have, Has, Familia y Objetos Personales", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C10", clase_numero: 10, semana: 5, sesion: "B", titulo_clase: "Clase 09: Presente Simple - 3ra Persona Singular", titulo_video: "CLASE 09: La 'S' que todo el mundo Olvida", video_url: "https://youtube.com/shorts/6yHn7Uj89Ik?si=Tgbyhn1234567890", tema_principal: "He/She/It en Presente Simple, Reglas de -s/-es/-ies", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C11", clase_numero: 11, semana: 6, sesion: "A", titulo_clase: "Clase 10: Presente Simple - Auxiliares Do / Does", titulo_video: "CLASE 10: Preguntas y Negaciones con Do y Does", video_url: "https://youtube.com/shorts/4eRf5Tg67Yh?si=Yhnuji1234567890", tema_principal: "Do, Does, Don't, Doesn't", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C12", clase_numero: 12, semana: 6, sesion: "B", titulo_clase: "Clase 11: Adverbios de Frecuencia", titulo_video: "CLASE 11: Always, Never, Sometimes - Rutinas Reales", video_url: "https://youtube.com/shorts/7uJm8Ik90Ol?si=Ujmiko1234567890", tema_principal: "Adverbios de Frecuencia y Posición Oracional", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C13", clase_numero: 13, semana: 7, sesion: "A", titulo_clase: "Clase 12: Wh- Questions en Presente", titulo_video: "CLASE 12: What, Where, When, Who, Why, How", video_url: "https://youtube.com/shorts/9oKp0Lm12Qe?si=Ikmlpo1234567890", tema_principal: "Wh- Information Questions", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C14", clase_numero: 14, semana: 7, sesion: "B", titulo_clase: "Clase 13: La Hora y Preposiciones de Tiempo (At, In, On)", titulo_video: "CLASE 13: Domina At, In, On para Horas y Fechas", video_url: "https://youtube.com/shorts/1qAz2Ws34Rf?si=Okmijn1234567890", tema_principal: "Telling Time, At/In/On Temporal", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C15", clase_numero: 15, semana: 8, sesion: "A", titulo_clase: "Clase 14: Preposiciones de Lugar (In, On, Under, Next to)", titulo_video: "CLASE 14: Dónde están las cosas en tu habitación", video_url: "https://youtube.com/shorts/3eDc4Rf56Tg?si=Plmokn1234567890", tema_principal: "Preposiciones de Espacio y Ubicación", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C16", clase_numero: 16, semana: 8, sesion: "B", titulo_clase: "Clase 15: There is / There are (Existencia)", titulo_video: "CLASE 15: Cómo decir 'Hay' en Inglés sin Errores", video_url: "https://youtube.com/shorts/5tGb6Yh78Uj?si=Qazwsx0987654321", tema_principal: "There is (singular/incontable) vs There are (plural)", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C17", clase_numero: 17, semana: 9, sesion: "A", titulo_clase: "Clase 16: Habilidades y Habilidad con Can / Can't", titulo_video: "CLASE 16: I Can Speak English - Verbo Modal Can", video_url: "https://youtube.com/shorts/7uJm8Ik90Ol?si=Wsxedc0987654321", tema_principal: "Can, Can't, Peticiones y Permisos", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C18", clase_numero: 18, semana: 9, sesion: "B", titulo_clase: "Clase 17: Pronombres Objeto (Me, Him, Her, Us, Them)", titulo_video: "CLASE 17: Pronombres Objeto que Cambian tus Frases", video_url: "https://youtube.com/shorts/9oKp0Lm12Qe?si=Edcrfv0987654321", tema_principal: "Direct and Indirect Object Pronouns", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C19", clase_numero: 19, semana: 10, sesion: "A", titulo_clase: "Clase 18: Presente Continuo (Acciones Ahora)", titulo_video: "CLASE 18: I am Studying - Estructura del Presente Continuo", video_url: "https://youtube.com/shorts/2wSx3Ed45Rf?si=Tgbvfd0987654321", tema_principal: "Subject + Be + Verb-ING", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C20", clase_numero: 20, semana: 10, sesion: "B", titulo_clase: "Clase 19: Presente Simple vs Presente Continuo", titulo_video: "CLASE 19: Rutina vs En Este Momento - Duelo de Tiempos", video_url: "https://youtube.com/shorts/4eRf5Tg67Yh?si=Yhnujm0987654321", tema_principal: "Contrast between Habits and Ongoing Actions", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C21", clase_numero: 21, semana: 11, sesion: "A", titulo_clase: "Clase 20: Imperativos y Dar Instrucciones", titulo_video: "CLASE 20: Comandos, Señales y Direcciones en la Calle", video_url: "https://youtube.com/shorts/6yHn7Uj89Ik?si=Ujmiko0987654321", tema_principal: "Imperatives (Positive & Negative), Giving Directions", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C22", clase_numero: 22, semana: 11, sesion: "B", titulo_clase: "Clase 21: Adjetivos y su Posición en la Frase", titulo_video: "CLASE 21: ¿Un carro rojo o un red car? Posición correcta", video_url: "https://youtube.com/shorts/8uJm9Kl01Op?si=Ikmlpo0987654321", tema_principal: "Adjective Word Order and Modifiers", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C23", clase_numero: 23, semana: 12, sesion: "A", titulo_clase: "Clase 22: Comparativos Regulares (-er / more)", titulo_video: "CLASE 22: Taller de Comparaciones Rápidas", video_url: "https://youtube.com/shorts/1qAz2Ws34Rf?si=Plmokn0987654321", tema_principal: "Comparative Adjectives (-er than, more ... than)", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C24", clase_numero: 24, semana: 12, sesion: "B", titulo_clase: "Clase 23: Superlativos (The -est / The Most)", titulo_video: "CLASE 23: El Más Alto, El Más Rápido - Superlativos", video_url: "https://youtube.com/shorts/3eDc4Rf56Tg?si=Qazwsx1122334455", tema_principal: "Superlative Adjectives in Everyday Context", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C25", clase_numero: 25, semana: 13, sesion: "A", titulo_clase: "Clase 24: Pasado Simple del Verbo To Be (Was / Were)", titulo_video: "CLASE 24: I Was There - Pasado de Ser y Estar", video_url: "https://youtube.com/shorts/5tGb6Yh78Uj?si=Wsxedc1122334455", tema_principal: "Was, Were, Wasn't, Weren't", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C26", clase_numero: 26, semana: 13, sesion: "B", titulo_clase: "Clase 25: Pasado Simple - Verbos Regulares (-ed)", titulo_video: "CLASE 25: Los 3 Sonidos de la Terminación -ED", video_url: "https://youtube.com/shorts/7uJm8Ik90Ol?si=Edcrfv1122334455", tema_principal: "Past Simple Regular Verbs, Pronunciation /t/, /d/, /ɪd/", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C27", clase_numero: 27, semana: 14, sesion: "A", titulo_clase: "Clase 26: Pasado Simple - Verbos Irregulares Top 20", titulo_video: "CLASE 26: Went, Had, Did, Saw - Los Verbos Clave", video_url: "https://youtube.com/shorts/9oKp0Lm12Qe?si=Tgbvfd1122334455", tema_principal: "Irregular Past Verbs and Memory Hacks", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C28", clase_numero: 28, semana: 14, sesion: "B", titulo_clase: "Clase 27: Pasado Simple - Auxiliar Did / Didn't", titulo_video: "CLASE 27: Preguntas y Negaciones en Pasado", video_url: "https://youtube.com/shorts/2wSx3Ed45Rf?si=Yhnujm1122334455", tema_principal: "Did you go? I didn't see", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C29", clase_numero: 29, semana: 15, sesion: "A", titulo_clase: "Clase 28: Planes a Futuro con Be Going To", titulo_video: "CLASE 28: I am Going to Travel - Planes Reales", video_url: "https://youtube.com/shorts/4eRf5Tg67Yh?si=Ujmiko1122334455", tema_principal: "Be going to + Infinitive for Intentions", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C30", clase_numero: 30, semana: 15, sesion: "B", titulo_clase: "Clase 29: Consolidación Final & Proyecto A1", titulo_video: "CLASE 29: Tu Gran Examen Oral y Certificación A1", video_url: "https://youtube.com/shorts/6yHn7Uj89Ik?si=Ikmlpo1122334455", tema_principal: "Integración de las 5 Habilidades en Inglés Real", tipo_contenido: "original", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C31", clase_numero: 31, semana: 16, sesion: "A", titulo_clase: "Clase 30: Repaso de Fluidez Auditiva A1", titulo_video: "Repaso Auditivo A1: Audio Inmersivo y Acentos", video_url: "https://youtube.com/shorts/8uJm9Kl01Op?si=Plmokn1122334455", tema_principal: "Listening Comprehension Booster", tipo_contenido: "repaso", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C32", clase_numero: 32, semana: 16, sesion: "B", titulo_clase: "Clase 31: Taller de Redacción de Correos y Mensajes", titulo_video: "Cómo Escribir tu Primer Correo Profesional en Inglés", video_url: "https://youtube.com/shorts/1qAz2Ws34Rf?si=Qazwsx9988776655", tema_principal: "Writing Practical Messages & Emails", tipo_contenido: "taller", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C33", clase_numero: 33, semana: 17, sesion: "A", titulo_clase: "Clase 32: Estrategias de Examen MCER A1", titulo_video: "Técnicas para Aprobar cualquier Examen A1", video_url: "https://youtube.com/shorts/3eDc4Rf56Tg?si=Wsxedc9988776655", tema_principal: "Exam Strategies, Timing, Elimination Tactics", tipo_contenido: "repaso", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C34", clase_numero: 34, semana: 17, sesion: "B", titulo_clase: "Clase 33: Simulacro Global Parte 1 (Grammar & Reading)", titulo_video: "Simulacro en Vivo: Gramática y Comprensión", video_url: "https://youtube.com/shorts/5tGb6Yh78Uj?si=Edcrfv9988776655", tema_principal: "Mock Exam Section A", tipo_contenido: "repaso", duracion_min: 120, estado: "activo" },
  { clase_id: "A1_C35", clase_numero: 35, semana: 18, sesion: "A", titulo_clase: "Clase 34: Simulacro Global Parte 2 (Listening & Speaking)", titulo_video: "Simulacro en Vivo: Escucha y Producción Oral", video_url: "https://youtube.com/shorts/7uJm8Ik90Ol?si=Tgbvfd9988776655", tema_principal: "Mock Exam Section B & Graduation", tipo_contenido: "repaso", duracion_min: 120, estado: "activo" },
];

export const INITIAL_USUARIOS: SheetUsuarioRow[] = [
  {
    user_id: 'demo_user_001',
    email: 'demo@teclingo.com',
    nombre: 'Estudiante Demo',
    avatar_url: '🧪',
    fecha_registro: '2026-09-08T00:00:00.000Z',
    nivel_actual: 'A1_C01',
    xp_total: 350,
    clases_completadas: 0,
    tipo_cuenta: 'demo',
    activo: true,
  },
  {
    user_id: 'usr_david_002',
    email: 'david@teclingo.com',
    nombre: 'David Rodríguez',
    avatar_url: null,
    fecha_registro: '2026-09-01T12:00:00.000Z',
    nivel_actual: 'A1_C02',
    xp_total: 520,
    clases_completadas: 1,
    tipo_cuenta: 'regular',
    activo: true,
  },
  {
    user_id: 'usr_sofia_003',
    email: 'sofia@teclingo.com',
    nombre: 'Sofía Valenzuela',
    avatar_url: null,
    fecha_registro: '2026-09-03T15:30:00.000Z',
    nivel_actual: 'A1_C03',
    xp_total: 890,
    clases_completadas: 2,
    tipo_cuenta: 'regular',
    activo: true,
  }
];

export const INITIAL_RESUMEN_PROGRESO: SheetResumenProgresoRow[] = [
  {
    resumen_id: "RES_user_teclingo_demo_A1_C01",
    user_id: "user_teclingo_demo",
    clase_id: "A1_C01",
    habilidades_completadas: 0,
    reactivos_totales_clase: 50,
    reactivos_correctos: 0,
    puntaje_obtenido: 0,
    puntaje_maximo_posible: 500,
    porcentaje_avance: 0,
    xp_ganado: 0,
    estado_clase: "pendiente",
    ultima_actualizacion: "2026-09-07T00:00:00Z",
    xp_obtenidos: 0,
    reactivos_resueltos: 0,
  },
  {
    resumen_id: "RES_user_teclingo_demo_A1_C02",
    user_id: "user_teclingo_demo",
    clase_id: "A1_C02",
    habilidades_completadas: 1,
    reactivos_totales_clase: 50,
    reactivos_correctos: 5,
    puntaje_obtenido: 50,
    puntaje_maximo_posible: 500,
    porcentaje_avance: 10,
    xp_ganado: 50,
    estado_clase: "en_progreso",
    ultima_actualizacion: "2026-09-07T03:20:00Z",
    xp_obtenidos: 50,
    reactivos_resueltos: 5,
  }
];

export const INITIAL_TEXTOS_BASE: SheetTextoBaseRow[] = [
  {
    texto_id: "A1_C01_TXT01",
    clase_id: "A1_C01",
    titulo: "My Classroom",
    titulo_texto: "My Classroom",
    contenido: "Hello! I am Ana. I am a student. This is my classroom. It is big and nice. My friend Carlos is here. He is a student too. We are friends. This is our teacher. Her name is Mrs. Garcia. She is a teacher. She is very nice. She has a book. It is a red book. The book is on the desk. Look! One book is here. Two books are there. Many books are in the classroom. The books are for the students. Many students are in the classroom. They are students. They are my friends. Carlos and I are students too. We are all happy. I like my classroom.",
    contenido_texto: "Hello! I am Ana. I am a student. This is my classroom. It is big and nice. My friend Carlos is here. He is a student too. We are friends. This is our teacher. Her name is Mrs. Garcia. She is a teacher. She is very nice. She has a book. It is a red book. The book is on the desk. Look! One book is here. Two books are there. Many books are in the classroom. The books are for the students. Many students are in the classroom. They are students. They are my friends. Carlos and I are students too. We are all happy. I like my classroom.",
    palabras_count: 105,
    dificultad: 1,
    audio_tts_url: "https://assets.teclingo.com/audio/txt_c01.mp3",
    tiempo_audio_seg: 60,
    tipo_texto: "descriptivo",
    activo: true
  },
  { texto_id: "A1_C02_TXT01", clase_id: "A1_C02", titulo: "My Friend David", titulo_texto: "My Friend David", contenido: "Hello! I am David and I am twenty-two years old. I am a student at the Technological Institute in Mexico. My friend Sarah is from Canada. She is an English teacher. We are very happy to practice together every afternoon!", contenido_texto: "Hello! I am David and I am twenty-two years old. I am a student at the Technological Institute in Mexico. My friend Sarah is from Canada. She is an English teacher. We are very happy to practice together every afternoon!", palabras_count: 42, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c02.mp3", tiempo_audio_seg: 24, tipo_texto: "dialogo", activo: true },
  { texto_id: "A1_C03_TXT01", clase_id: "A1_C03", titulo: "At the Airport Counter", titulo_texto: "At the Airport Counter", contenido: "Excuse me, officer. Is this the flight to Guadalajara? No, sir, it isn't. That flight is at Gate 14. Are you ready with your passport? Yes, I am. Thank you very much for your help!", contenido_texto: "Excuse me, officer. Is this the flight to Guadalajara? No, sir, it isn't. That flight is at Gate 14. Are you ready with your passport? Yes, I am. Thank you very much for your help!", palabras_count: 37, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c03.mp3", tiempo_audio_seg: 20, tipo_texto: "dialogo", activo: true },
  { texto_id: "A1_C04_TXT01", clase_id: "A1_C04", titulo: "In the Kitchen", titulo_texto: "In the Kitchen", contenido: "There are four red apples on the wooden table. We have some fresh milk and bread in the refrigerator, but we don't have any orange juice. How much water do you drink during study sessions?", contenido_texto: "There are four red apples on the wooden table. We have some fresh milk and bread in the refrigerator, but we don't have any orange juice. How much water do you drink during study sessions?", palabras_count: 37, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c04.mp3", tiempo_audio_seg: 21, tipo_texto: "descriptivo", activo: true },
  { texto_id: "A1_C05_TXT01", clase_id: "A1_C05", titulo: "Maria's Workspace", titulo_texto: "Maria's Workspace", contenido: "This is Maria's new office. Her computer is on the left side of the desk, and her brother's notebook is on the right. She loves working with technological tools because everything is organized.", contenido_texto: "This is Maria's new office. Her computer is on the left side of the desk, and her brother's notebook is on the right. She loves working with technological tools because everything is organized.", palabras_count: 34, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c05.mp3", tiempo_audio_seg: 19, tipo_texto: "descriptivo", activo: true },
  { texto_id: "A1_C06_TXT01", clase_id: "A1_C06", titulo: "Whose Backpack is This?", titulo_texto: "Whose Backpack is This?", contenido: "Look at these two bags! That blue backpack is mine, and the black one is yours. Where is Carlos? His project folder is here on the sofa, so this notebook must be his.", contenido_texto: "Look at these two bags! That blue backpack is mine, and the black one is yours. Where is Carlos? His project folder is here on the sofa, so this notebook must be his.", palabras_count: 35, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c06.mp3", tiempo_audio_seg: 20, tipo_texto: "dialogo", activo: true },
  { texto_id: "A1_C07_TXT01", clase_id: "A1_C07", titulo: "At the Gadget Store", titulo_texto: "At the Gadget Store", contenido: "This smartwatch is very fast and modern. That laptop over there is expensive, but those headphones are on sale today. I really like these digital tools for learning languages at home.", contenido_texto: "This smartwatch is very fast and modern. That laptop over there is expensive, but those headphones are on sale today. I really like these digital tools for learning languages at home.", palabras_count: 33, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c07.mp3", tiempo_audio_seg: 18, tipo_texto: "descriptivo", activo: true },
  { texto_id: "A1_C08_TXT01", clase_id: "A1_C08", titulo: "Elena's Daily Schedule", titulo_texto: "Elena's Daily Schedule", contenido: "Elena works as an architect in Monterrey. Every day, she leaves her house at seven o'clock and takes an hour to review building designs. She carries a notebook and an umbrella in her briefcase.", contenido_texto: "Elena works as an architect in Monterrey. Every day, she leaves her house at seven o'clock and takes an hour to review building designs. She carries a notebook and an umbrella in her briefcase.", palabras_count: 35, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c08.mp3", tiempo_audio_seg: 20, tipo_texto: "narrativo", activo: true },
  { texto_id: "A1_C09_TXT01", clase_id: "A1_C09", titulo: "Our Big Family", titulo_texto: "Our Big Family", contenido: "I have a big family. I have two older brothers and one little sister. My brother Luis has a fast red car, and my parents have a cozy house in the countryside. We love spending weekends together.", contenido_texto: "I have a big family. I have two older brothers and one little sister. My brother Luis has a fast red car, and my parents have a cozy house in the countryside. We love spending weekends together.", palabras_count: 37, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c09.mp3", tiempo_audio_seg: 21, tipo_texto: "narrativo", activo: true },
  { texto_id: "A1_C10_TXT01", clase_id: "A1_C10", titulo: "A Software Engineer's Day", titulo_texto: "A Software Engineer's Day", contenido: "Mateo works as a developer for a tech startup. He wakes up at 6:30 AM, drinks black coffee, and studies English grammar before starting his coding sprint. He always finishes his tasks on time.", contenido_texto: "Mateo works as a developer for a tech startup. He wakes up at 6:30 AM, drinks black coffee, and studies English grammar before starting his coding sprint. He always finishes his tasks on time.", palabras_count: 34, dificultad: 1, audio_tts_url: "https://assets.teclingo.com/audio/txt_c10.mp3", tiempo_audio_seg: 19, tipo_texto: "narrativo", activo: true },
];

export interface DatasheetState {
  configuracion: any[];
  clases: SheetClaseRow[];
  vocabulario: SheetVocabularioRow[];
  verbos: any[];
  textoExplicativo: any[];
  textosBase: SheetTextoBaseRow[];
  reactivos: any[];
  exposiciones: any[];
  examenes: any[];
  progresoUsuario: SheetProgresoUsuarioRow[];
  resumenProgreso: SheetResumenProgresoRow[];
  usuarios?: SheetUsuarioRow[];
  lastSyncedAt?: string;
  sourceUrl?: string;
}

export function loadDatasheetFromStorage(): DatasheetState {
  return {
    configuracion: [],
    clases: INITIAL_CLASES,
    vocabulario: INITIAL_VOCABULARIO,
    verbos: [],
    textoExplicativo: [],
    textosBase: INITIAL_TEXTOS_BASE,
    reactivos: [],
    exposiciones: [],
    examenes: [],
    progresoUsuario: [],
    resumenProgreso: INITIAL_RESUMEN_PROGRESO,
    usuarios: INITIAL_USUARIOS,
    lastSyncedAt: new Date().toISOString(),
    sourceUrl: 'workbookData',
  };
}

export function saveDatasheetToStorage(_data: DatasheetState): void { /* no-op: Prisma es la fuente de verdad */ }

export const clases: SheetClaseRow[] = INITIAL_CLASES;
export const progresoUsuario: SheetProgresoUsuarioRow[] = [];
export const resumenProgreso: SheetResumenProgresoRow[] = INITIAL_RESUMEN_PROGRESO;
export const usuarios: SheetUsuarioRow[] = INITIAL_USUARIOS;

export function getTextoBaseFromSheet(claseId: string): SheetTextoBaseRow | null {
  const found = INITIAL_TEXTOS_BASE.find((t) => t.clase_id.toUpperCase() === claseId.toUpperCase());
  if (!found) return null;
  const titulo = found.titulo_texto || found.titulo || 'Reading Comprehension';
  const contenido = found.contenido_texto || found.contenido || '';
  const palabras = found.palabras_count || (contenido ? contenido.split(' ').filter(Boolean).length : 38);
  return {
    ...found,
    titulo_texto: titulo,
    titulo: titulo,
    contenido_texto: contenido,
    contenido: contenido,
    palabras_count: palabras,
    tiempo_audio_seg: found.tiempo_audio_seg || Math.max(15, Math.round(palabras * 0.6)),
    activo: found.activo !== undefined ? found.activo : true,
  };
}


export const INITIAL_TEXTO_EXPLICATIVO: any[] = [];
