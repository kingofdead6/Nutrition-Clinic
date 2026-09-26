/**
 * Starter food database (values per serving, from standard composition tables, rounded).
 * Installed on first-run setup and from the foods page ("install defaults"); the seed
 * script reuses it. Columns: name (ar), nameFr, category, servingSize, servingUnit,
 * calories, proteinG, carbsG, fatG, fiberG.
 */

/** @type {Array<[string, string, import('@clinic/shared').FoodCategory, number, import('@clinic/shared').ServingUnit, number, number, number, number, number]>} */
const ROWS = [
  // Grains & starches
  ['خبز أبيض (باقيت)', 'Baguette', 'grains', 50, 'g', 135, 4.5, 27.5, 0.8, 1.3],
  ['خبز كامل', 'Pain complet', 'grains', 50, 'g', 125, 6, 21, 1.7, 3.5],
  ['خبز الشعير', "Pain d'orge", 'grains', 50, 'g', 120, 4, 23, 1, 4],
  ['أرز أبيض مطبوخ', 'Riz blanc cuit', 'grains', 100, 'g', 130, 2.7, 28, 0.3, 0.4],
  ['أرز كامل مطبوخ', 'Riz complet cuit', 'grains', 100, 'g', 112, 2.3, 23.5, 0.8, 1.8],
  ['معكرونة مطبوخة', 'Pâtes cuites', 'grains', 100, 'g', 158, 5.8, 31, 0.9, 1.8],
  ['كسكس مطبوخ', 'Couscous cuit', 'grains', 100, 'g', 112, 3.8, 23.2, 0.2, 1.4],
  ['فريك مطبوخ', 'Frik cuit', 'grains', 100, 'g', 130, 5, 26, 0.6, 4.5],
  ['شوفان', "Flocons d'avoine", 'grains', 40, 'g', 152, 5.3, 26.5, 2.8, 4],
  ['رقائق الذرة', 'Corn flakes', 'grains', 30, 'g', 113, 2.1, 25, 0.3, 0.9],
  ['بطاطا مسلوقة', 'Pomme de terre bouillie', 'grains', 100, 'g', 87, 1.9, 20, 0.1, 1.8],
  ['بطاطا مقلية', 'Frites', 'grains', 100, 'g', 312, 3.4, 41, 15, 3.8],
  ['بطاطا حلوة مشوية', 'Patate douce rôtie', 'grains', 100, 'g', 90, 2, 20.7, 0.2, 3.3],
  ['خبز التوست', 'Pain de mie', 'grains', 25, 'g', 67, 2.2, 12.5, 0.9, 0.6],

  // Proteins
  ['صدر دجاج مشوي', 'Blanc de poulet grillé', 'proteins', 100, 'g', 165, 31, 0, 3.6, 0],
  ['فخذ دجاج مشوي', 'Cuisse de poulet rôtie', 'proteins', 100, 'g', 209, 26, 0, 10.9, 0],
  ['ديك رومي', 'Dinde', 'proteins', 100, 'g', 135, 29, 0, 1.5, 0],
  ['لحم غنم مطبوخ', 'Agneau cuit', 'proteins', 100, 'g', 294, 25, 0, 21, 0],
  ['لحم بقر مفروم (15%)', 'Bœuf haché 15%', 'proteins', 100, 'g', 250, 26, 0, 15, 0],
  ['لحم بقر مشوي', 'Bœuf grillé maigre', 'proteins', 100, 'g', 187, 29, 0, 7.4, 0],
  ['كبدة', 'Foie de bœuf', 'proteins', 100, 'g', 175, 27, 5, 4.8, 0],
  ['مرقاز', 'Merguez', 'proteins', 100, 'g', 300, 15, 2, 26, 0],
  ['سردين مشوي', 'Sardines grillées', 'proteins', 100, 'g', 208, 25, 0, 11, 0],
  ['سمك أبيض مشوي', 'Poisson blanc grillé', 'proteins', 100, 'g', 105, 23, 0, 1.2, 0],
  ['تونة بالماء', 'Thon au naturel', 'proteins', 100, 'g', 116, 26, 0, 1, 0],
  ['تونة بالزيت', "Thon à l'huile", 'proteins', 100, 'g', 198, 29, 0, 8, 0],
  ['قمرون', 'Crevettes', 'proteins', 100, 'g', 99, 24, 0.2, 0.3, 0],
  ['بيض مسلوق', 'Œuf dur', 'proteins', 1, 'piece', 78, 6.3, 0.6, 5.3, 0],
  ['بيض مقلي', 'Œuf au plat', 'proteins', 1, 'piece', 90, 6.3, 0.4, 7, 0],
  ['عدس مطبوخ', 'Lentilles cuites', 'proteins', 100, 'g', 116, 9, 20, 0.4, 7.9],
  ['حمص مطبوخ', 'Pois chiches cuits', 'proteins', 100, 'g', 164, 8.9, 27.4, 2.6, 7.6],
  ['فاصوليا بيضاء مطبوخة', 'Haricots blancs cuits', 'proteins', 100, 'g', 139, 9.7, 25, 0.4, 6.3],
  ['فول مطبوخ', 'Fèves cuites', 'proteins', 100, 'g', 110, 7.6, 19.7, 0.4, 5.4],

  // Dairy
  ['حليب كامل الدسم', 'Lait entier', 'dairy', 250, 'ml', 155, 8, 12, 8.5, 0],
  ['حليب خالي الدسم', 'Lait écrémé', 'dairy', 250, 'ml', 85, 8.5, 12.5, 0.3, 0],
  ['لبن', 'Lben', 'dairy', 250, 'ml', 110, 8, 12, 3.5, 0],
  ['رايب', 'Raïb', 'dairy', 250, 'ml', 150, 8.5, 11.5, 8, 0],
  ['ياغورت طبيعي', 'Yaourt nature', 'dairy', 1, 'piece', 72, 4.4, 5.5, 3.5, 0],
  ['ياغورت بالفواكه', 'Yaourt aux fruits', 'dairy', 1, 'piece', 110, 3.8, 17, 2.8, 0],
  ['جبن أحمر (إيدام)', 'Edam', 'dairy', 30, 'g', 107, 7.5, 0.4, 8.3, 0],
  ['جبن مثلثات', 'Fromage fondu (portion)', 'dairy', 1, 'piece', 45, 2, 1, 3.7, 0],
  ['جبن أبيض طري', 'Fromage frais', 'dairy', 100, 'g', 98, 11, 3.4, 4.3, 0],
  ['كاممبير', 'Camembert', 'dairy', 30, 'g', 90, 6, 0.1, 7.3, 0],

  // Fruits
  ['تمر (دقلة نور)', 'Datte Deglet Nour', 'fruits', 1, 'piece', 23, 0.2, 6, 0, 0.6],
  ['موز', 'Banane', 'fruits', 1, 'piece', 107, 1.3, 27.4, 0.4, 3.1],
  ['تفاح', 'Pomme', 'fruits', 1, 'piece', 78, 0.4, 20.7, 0.3, 3.6],
  ['برتقال', 'Orange', 'fruits', 1, 'piece', 70, 1.4, 17.6, 0.2, 3.6],
  ['كليمنتين', 'Clémentine', 'fruits', 1, 'piece', 35, 0.6, 9, 0.1, 1.3],
  ['إجاص', 'Poire', 'fruits', 1, 'piece', 97, 0.6, 26, 0.2, 5.3],
  ['تين', 'Figue', 'fruits', 1, 'piece', 37, 0.4, 9.6, 0.2, 1.5],
  ['عنب', 'Raisin', 'fruits', 100, 'g', 69, 0.7, 18, 0.2, 0.9],
  ['بطيخ أحمر', 'Pastèque', 'fruits', 200, 'g', 60, 1.2, 15, 0.3, 0.8],
  ['شمام', 'Melon', 'fruits', 200, 'g', 68, 1.7, 16, 0.4, 1.8],
  ['مشمش', 'Abricot', 'fruits', 100, 'g', 48, 1.4, 11, 0.4, 2],
  ['فراولة', 'Fraises', 'fruits', 100, 'g', 32, 0.7, 7.7, 0.3, 2],
  ['رمان', 'Grenade', 'fruits', 100, 'g', 83, 1.7, 18.7, 1.2, 4],
  ['تين شوكي (الهندي)', 'Figue de Barbarie', 'fruits', 100, 'g', 41, 0.7, 9.6, 0.5, 3.6],

  // Vegetables
  ['طماطم', 'Tomate', 'vegetables', 100, 'g', 18, 0.9, 3.9, 0.2, 1.2],
  ['خيار', 'Concombre', 'vegetables', 100, 'g', 15, 0.7, 3.6, 0.1, 0.5],
  ['جزر', 'Carotte', 'vegetables', 100, 'g', 41, 0.9, 9.6, 0.2, 2.8],
  ['خس', 'Laitue', 'vegetables', 100, 'g', 15, 1.4, 2.9, 0.2, 1.3],
  ['كوسة', 'Courgette', 'vegetables', 100, 'g', 17, 1.2, 3.1, 0.3, 1],
  ['فلفل حلو', 'Poivron', 'vegetables', 100, 'g', 26, 1, 6, 0.3, 2.1],
  ['بصل', 'Oignon', 'vegetables', 100, 'g', 40, 1.1, 9.3, 0.1, 1.7],
  ['سبانخ', 'Épinards', 'vegetables', 100, 'g', 23, 2.9, 3.6, 0.4, 2.2],
  ['فاصوليا خضراء', 'Haricots verts', 'vegetables', 100, 'g', 31, 1.8, 7, 0.2, 2.7],
  ['بروكلي', 'Brocoli', 'vegetables', 100, 'g', 34, 2.8, 6.6, 0.4, 2.6],
  ['باذنجان', 'Aubergine', 'vegetables', 100, 'g', 25, 1, 5.9, 0.2, 3],
  ['شمندر', 'Betterave', 'vegetables', 100, 'g', 43, 1.6, 9.6, 0.2, 2.8],

  // Fats, nuts & seeds
  ['زيت الزيتون', "Huile d'olive", 'fats', 1, 'tbsp', 119, 0, 0, 13.5, 0],
  ['زبدة', 'Beurre', 'fats', 10, 'g', 72, 0.1, 0, 8.1, 0],
  ['مايونيز', 'Mayonnaise', 'fats', 1, 'tbsp', 94, 0.1, 0.1, 10.3, 0],
  ['لوز', 'Amandes', 'fats', 30, 'g', 174, 6.3, 6.5, 15, 3.7],
  ['جوز', 'Noix', 'fats', 30, 'g', 196, 4.6, 4.1, 19.6, 2],
  ['فول سوداني', 'Cacahuètes', 'fats', 30, 'g', 170, 7.7, 4.8, 14.8, 2.6],
  ['زيتون', 'Olives', 'fats', 30, 'g', 44, 0.3, 1.8, 4.3, 1],
  ['أفوكادو', 'Avocat', 'fats', 100, 'g', 160, 2, 8.5, 14.7, 6.7],

  // Sweets
  ['سكر', 'Sucre', 'sweets', 1, 'tbsp', 48, 0, 12, 0, 0],
  ['عسل', 'Miel', 'sweets', 1, 'tbsp', 64, 0.1, 17, 0, 0],
  ['مربى', 'Confiture', 'sweets', 1, 'tbsp', 56, 0.1, 13.8, 0, 0.2],
  ['شوكولاتة بالحليب', 'Chocolat au lait', 'sweets', 20, 'g', 107, 1.5, 11.8, 6, 0.5],
  ['بسكويت', 'Biscuits secs', 'sweets', 30, 'g', 140, 2, 20, 6, 0.6],
  ['مقروط', 'Makrout', 'sweets', 1, 'piece', 170, 2, 24, 7.5, 1.5],
  ['قلب اللوز', 'Qalb el louz', 'sweets', 1, 'piece', 230, 3, 38, 7.5, 1],
  ['زلابية', 'Zlabia', 'sweets', 50, 'g', 190, 1, 32, 6.5, 0.3],
  ['حلوى الطحينة (حلوى الترك)', 'Halwa turc', 'sweets', 30, 'g', 155, 3.8, 15, 9, 1.4],

  // Drinks
  ['عصير برتقال طبيعي', "Jus d'orange frais", 'drinks', 250, 'ml', 112, 1.7, 26, 0.5, 0.5],
  ['مشروب غازي', 'Soda', 'drinks', 330, 'ml', 139, 0, 35, 0, 0],
  ['قهوة بدون سكر', 'Café noir', 'drinks', 1, 'cup', 2, 0.3, 0, 0, 0],
  ['قهوة بالحليب', 'Café au lait', 'drinks', 1, 'cup', 60, 3, 5, 3, 0],
  ['شاي بالنعناع محلى', 'Thé à la menthe sucré', 'drinks', 1, 'cup', 60, 0, 15, 0, 0],

  // Traditional Algerian dishes
  ['شربة فريك', 'Chorba frik', 'traditional', 300, 'ml', 210, 11, 25, 7, 3],
  ['حريرة', 'Harira', 'traditional', 300, 'ml', 220, 10, 30, 6.5, 5],
  ['كسكس بالخضر واللحم', 'Couscous légumes et viande', 'traditional', 350, 'g', 560, 26, 75, 17, 8],
  ['رشتة', 'Rechta', 'traditional', 300, 'g', 480, 22, 60, 16, 4],
  ['لوبيا', 'Loubia (haricots en sauce)', 'traditional', 250, 'g', 290, 14, 40, 8, 12],
  ['شخشوخة', 'Chakhchoukha', 'traditional', 300, 'g', 540, 22, 68, 20, 5],
  ['طاجين زيتون', 'Tajine zitoune', 'traditional', 250, 'g', 360, 25, 10, 25, 3],
  ['دولمة', 'Dolma', 'traditional', 250, 'g', 330, 16, 18, 21, 4],
  ['شكشوكة', 'Chakchouka', 'traditional', 250, 'g', 200, 9, 12, 13, 4],
  ['سلاطة مشوية', 'Salade méchouia', 'traditional', 150, 'g', 110, 2, 9, 7.5, 3],
  ['كرانطيطة', 'Garantita', 'traditional', 150, 'g', 330, 9, 25, 21, 4],
  ['بوراك', 'Bourek', 'traditional', 1, 'piece', 190, 7, 14, 12, 0.8],
  ['محاجب', 'Mhadjeb', 'traditional', 1, 'piece', 320, 6, 42, 14, 3],
  ['مسمن', 'Msemen', 'traditional', 1, 'piece', 270, 5, 35, 12, 1.5],
  ['بغرير', 'Baghrir', 'traditional', 1, 'piece', 110, 3, 22, 0.7, 1],
  ['كسرة (خبز الدار)', 'Galette kesra', 'traditional', 100, 'g', 300, 7, 52, 7, 3],
  ['مطلوع', "Matlou' (pain maison)", 'traditional', 100, 'g', 280, 8.5, 55, 2.5, 2.5],
];

/** @returns {import('../repositories/interfaces/common.js').NewEntity<import('@clinic/shared').Food>[]} */
export function defaultFoods() {
  return ROWS.map(([name, nameFr, category, servingSize, servingUnit, calories, proteinG, carbsG, fatG, fiberG]) => ({
    name,
    nameFr,
    category,
    servingSize,
    servingUnit,
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    isCustom: false,
  }));
}
