import { EN } from './en';
import type { TextTable } from './index';
import { FR_TEXTS } from './fr-texts';

/** The French table (the operator's sheet of journal Passe RG2: RG-11 « Récit en vous, chaque personnage selon qui il est », RG-12 « Noms gardés, titres et
 *  lieux traduits », RG-14): every key of the English, written in French (`fr-texts.ts`), and the forms French grammar needs (`<key>|<form>`: a place
 *  after « à » or « sur », an item without its article…). Loaded on demand by the page (src/settings/language.ts); never by the simulation, which writes its
 *  state in English (journal Passe RG4). Pure data. */
export const FR: TextTable = { ...EN, ...FR_TEXTS } as TextTable;
