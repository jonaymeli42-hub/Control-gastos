import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoiceExpense} from '../voice-expense-parser.js';
const categories=[{id:'super',name:'Supermercado'},{id:'pharmacy',name:'Farmacia'},{id:'food',name:'Comida'},{id:'fuel',name:'Nafta'}];
const parse=text=>parseVoiceExpense(text,categories,'2026-10-18');
test('recognizes Spanish audio with currency separators, location, category and relative date',()=>{
 const d=parse('Gasté 8.500,50 pesos en supermercado de efectivo ayer');
 assert.equal(d.cents,850050);assert.equal(d.categoryId,'super');assert.equal(d.location,'cash');assert.equal(d.date,'2026-10-17');
 assert.equal(parse('Pagué 8500.50 en farmacia con virtual').cents,850050);
 assert.equal(parse('Gasté 8,500 en supermercado de efectivo').cents,850000);
});
test('spoken Spanish amounts including thousands, millions and cents',()=>{
 assert.equal(parse('Gasté ocho mil quinientos pesos en supermercado con efectivo').cents,850000);
 assert.equal(parse('Pagué veintidós mil trescientos cincuenta pesos en farmacia de virtual').cents,2235000);
 assert.equal(parse('Gasté un millón doscientos mil pesos en comida con efectivo').cents,120000000);
 assert.equal(parse('Gasté ocho mil quinientos pesos con cincuenta en farmacia de efectivo').cents,850050);
 assert.equal(parse('Gasté 8500 con 50 en farmacia de virtual').cents,850050);
 assert.equal(parse('Gasté 8 mil en farmacia con efectivo').cents,800000);
});
test('unknown amounts or locations require manual review instead of guessing',()=>{
 assert.equal(parse('Compré remedios en farmacia').cents,null);
 assert.equal(parse('Gasté 8500 en farmacia').location,'');
 assert.equal(parse('Gasté 8500 en farmacia de efectivo y virtual').location,'');
 assert.equal(parse('Gasté 8500 en farmacia y 2000 en comida').cents,null);
 assert.equal(parse('Gasté 8500 en una categoría desconocida').categoryId,'');
});
test('explicit dates are not interpreted as money and input remains plain text',()=>{
 const d=parse('Pagué 8500 pesos en farmacia de virtual el 15/10/2026');
 assert.equal(d.cents,850000);assert.equal(d.date,'2026-10-15');
 const invalid=parse('Gasté 8500 en farmacia el 31/02/2026');assert.equal(invalid.date,'2026-10-18');assert.match(invalid.warnings.join(' '),/fecha/);
 assert.ok(parse('<img src=x onerror=alert(1)>').description.length<=100);
 assert.equal(parse('Gasté 0 en farmacia con efectivo').cents,null);
 assert.equal(parse('Gasté -8500 en farmacia con efectivo').cents,null);
 assert.equal(parse('Gasté 8 mil quinientos en farmacia con efectivo').cents,null);
});
