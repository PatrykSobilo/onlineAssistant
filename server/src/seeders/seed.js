const bcrypt = require('bcryptjs');
const { User, UserSettings, NoteCategory, NoteSubCategory, Note } = require('../models');
const { sequelize } = require('../config/database');

async function seed() {
  try {
    console.log('🌱 Rozpoczynam seedowanie bazy danych...\n');

    // Wyczyść istniejące dane (UWAGA: to usuwa wszystko!)
    console.log('🗑️  Czyszczenie istniejących danych...');
    await Note.destroy({ where: {}, force: true });
    await NoteSubCategory.destroy({ where: {}, force: true });
    await NoteCategory.destroy({ where: {}, force: true });
    await UserSettings.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    console.log('✅ Dane wyczyszczone\n');

    // 1. Utwórz użytkownika testowego
    console.log('👤 Tworzenie użytkownika testowego...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword
    });

    await UserSettings.create({
      userId: user.id,
      language: 'pl',
      theme: 'dark',
      notificationsEnabled: true,
      defaultVoiceLanguage: 'pl-PL'
    });
    console.log('✅ Użytkownik utworzony: test@example.com / test123\n');

    // 2. Utwórz kategorie
    console.log('📁 Tworzenie kategorii...');
    const categoryPraca = await NoteCategory.create({
      userId: user.id,
      name: 'Praca',
      icon: '💼',
      color: '#3B82F6',
      isActive: true
    });

    const categoryHobbyPilka = await NoteCategory.create({
      userId: user.id,
      name: 'Hobby - Piłka nożna',
      icon: '⚽',
      color: '#10B981',
      isActive: true
    });

    const categoryHobbyWedkarstwo = await NoteCategory.create({
      userId: user.id,
      name: 'Hobby - Wędkarstwo',
      icon: '🎣',
      color: '#F59E0B',
      isActive: true
    });

    const categoryOsobiste = await NoteCategory.create({
      userId: user.id,
      name: 'Osobiste',
      icon: '🏠',
      color: '#8B5CF6',
      isActive: true
    });
    console.log('✅ Utworzono 4 kategorie\n');

    // 3. Utwórz hierarchię subkategorii dla "Praca"
    console.log('🌳 Tworzenie hierarchii subkategorii dla Praca...');
    
    // Poziom 1
    const subKlientABC = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Klient ABC',
      isActive: true,
      isUnlocked: true
    });

    const subKlientXYZ = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Klient XYZ',
      isActive: true,
      isUnlocked: true
    });

    const subProjekty = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Projekty wewnętrzne',
      isActive: true,
      isUnlocked: true
    });

    // Poziom 2 (dzieci Klient ABC)
    const subFakturyZakupu = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: subKlientABC.id,
      level: 2,
      name: 'Faktury zakupu',
      isActive: true,
      isUnlocked: true
    });

    const subFakturySprzedazy = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: subKlientABC.id,
      level: 2,
      name: 'Faktury sprzedaży',
      isActive: true,
      isUnlocked: true
    });

    const subSpotkania = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: subKlientABC.id,
      level: 2,
      name: 'Spotkania',
      isActive: true,
      isUnlocked: true
    });

    // Poziom 3 (dzieci Faktury zakupu) - ZABLOKOWANE domyślnie
    const subZakupUslugi = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: subFakturyZakupu.id,
      level: 3,
      name: 'Zakup usług',
      isActive: true,
      isUnlocked: false // Poziom 3 zablokowany
    });

    const subZakupTowarow = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: subFakturyZakupu.id,
      level: 3,
      name: 'Zakup towarów',
      isActive: true,
      isUnlocked: false // Poziom 3 zablokowany
    });

    // Odblokujmy jedną subkategorię poziom 3 dla przykładu
    await subZakupUslugi.update({ isUnlocked: true });

    // Poziom 4 (dziecko Zakup usług)
    const subCzyszczenieKomputera = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: subZakupUslugi.id,
      level: 4,
      name: 'Czyszczenie komputera',
      isActive: true,
      isUnlocked: false // Poziom 4 zablokowany
    });

    // Poziom 2 dla Projekty wewnętrzne
    const subProjektAlpha = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryPraca.id,
      parentSubCategoryId: subProjekty.id,
      level: 2,
      name: 'Projekt Alpha',
      isActive: true,
      isUnlocked: true
    });

    console.log('✅ Utworzono hierarchię dla Praca (13 subkategorii)\n');

    // 4. Subkategorie dla Hobby - Piłka nożna
    console.log('⚽ Tworzenie subkategorii dla Piłka nożna...');
    
    const subTrening = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyPilka.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Trening',
      isActive: true,
      isUnlocked: true
    });

    const subMecze = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyPilka.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Mecze',
      isActive: true,
      isUnlocked: true
    });

    const subBieganie = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyPilka.id,
      parentSubCategoryId: subTrening.id,
      level: 2,
      name: 'Bieganie',
      isActive: true,
      isUnlocked: true
    });

    const subSilownia = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyPilka.id,
      parentSubCategoryId: subTrening.id,
      level: 2,
      name: 'Siłownia',
      isActive: true,
      isUnlocked: true
    });

    console.log('✅ Utworzono 4 subkategorie dla Piłka nożna\n');

    // 5. Subkategorie dla Wędkarstwo
    console.log('🎣 Tworzenie subkategorii dla Wędkarstwo...');
    
    const subSprzet = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyWedkarstwo.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Sprzęt',
      isActive: true,
      isUnlocked: true
    });

    const subLowiska = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyWedkarstwo.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Łowiska',
      isActive: true,
      isUnlocked: true
    });

    const subHaczyki = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyWedkarstwo.id,
      parentSubCategoryId: subSprzet.id,
      level: 2,
      name: 'Haczyki',
      isActive: true,
      isUnlocked: true
    });

    const subWedki = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyWedkarstwo.id,
      parentSubCategoryId: subSprzet.id,
      level: 2,
      name: 'Wędki',
      isActive: true,
      isUnlocked: true
    });

    console.log('✅ Utworzono 4 subkategorie dla Wędkarstwo\n');

    // 6. Utwórz przykładowe notatki
    console.log('📝 Tworzenie przykładowych notatek...');

    // Notatki dla Praca -> Klient ABC -> Faktury zakupu
    await Note.create({
      userId: user.id,
      noteCategoryId: categoryPraca.id,
      noteSubCategoryId1: subKlientABC.id,
      noteSubCategoryId2: subFakturyZakupu.id,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['faktura', '2025', 'pilne'],
      content: 'Faktura nr 001/2025 - zakup materiałów biurowych. Wartość: 1250 PLN netto. Termin płatności: 30 dni.',
      source: 'text',
      language: 'pl',
      aiResponse: null
    });

    await Note.create({
      userId: user.id,
      noteCategoryId: categoryPraca.id,
      noteSubCategoryId1: subKlientABC.id,
      noteSubCategoryId2: subFakturyZakupu.id,
      noteSubCategoryId3: subZakupUslugi.id,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['usługa', 'IT', '2025'],
      content: 'Faktura za konserwację systemu IT - styczeń 2025. Wartość: 3500 PLN netto.',
      source: 'text',
      language: 'pl',
      aiResponse: 'Zarejestrowano usługę IT w systemie księgowym.'
    });

    // Notatki dla Praca -> Klient ABC -> Spotkania
    await Note.create({
      userId: user.id,
      noteCategoryId: categoryPraca.id,
      noteSubCategoryId1: subKlientABC.id,
      noteSubCategoryId2: subSpotkania.id,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['spotkanie', 'q1-2025', 'strategia'],
      content: 'Spotkanie strategiczne Q1 2025:\n- Omówienie nowych projektów\n- Budżet na rok 2025\n- Planowane inwestycje\n- Nowe zamówienia',
      source: 'voice',
      language: 'pl',
      aiResponse: 'Podsumowanie: Klient planuje zwiększyć budżet o 25% w Q2. Priorytety: digitalizacja i automatyzacja procesów.'
    });

    // Notatki dla Projekty -> Projekt Alpha
    await Note.create({
      userId: user.id,
      noteCategoryId: categoryPraca.id,
      noteSubCategoryId1: subProjekty.id,
      noteSubCategoryId2: subProjektAlpha.id,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['projekt', 'milestone', 'deadline'],
      content: 'Projekt Alpha - Milestone 1 ukończony!\nNastępne kroki:\n- Testy jednostkowe\n- Code review\n- Deploy na staging\nDeadline: 31.01.2025',
      source: 'text',
      language: 'pl',
      aiResponse: null
    });

    // Notatki dla Hobby - Piłka -> Trening
    await Note.create({
      userId: user.id,
      noteCategoryId: categoryHobbyPilka.id,
      noteSubCategoryId1: subTrening.id,
      noteSubCategoryId2: subBieganie.id,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['trening', 'bieganie', 'cardio'],
      content: 'Sesja biegowa 14.01.2025:\n- Dystans: 8 km\n- Czas: 42 minuty\n- Tempo: 5:15 min/km\n- Puls średni: 165 bpm\nSamopoczucie: świetne!',
      source: 'voice',
      language: 'pl',
      aiResponse: 'Analiza treningu: Tempo poprawione o 15 sekund w porównaniu do poprzedniej sesji. Świetna forma!'
    });

    await Note.create({
      userId: user.id,
      noteCategoryId: categoryHobbyPilka.id,
      noteSubCategoryId1: subMecze.id,
      noteSubCategoryId2: null,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['mecz', 'liga', 'wygrana'],
      content: 'Mecz ligowy 12.01.2025: Nasza drużyna vs FC Lions\nWynik: 3:1\nMoje gole: 2\nAsysty: 1\nŚwietny występ całego zespołu!',
      source: 'text',
      language: 'pl',
      aiResponse: null
    });

    // Notatki dla Wędkarstwo
    await Note.create({
      userId: user.id,
      noteCategoryId: categoryHobbyWedkarstwo.id,
      noteSubCategoryId1: subSprzet.id,
      noteSubCategoryId2: subHaczyki.id,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['sprzęt', 'zakup', 'haczyki'],
      content: 'Zakup nowych haczyków:\n- Rozmiar: 8, 10, 12\n- Typ: Owner\n- Ilość: 50 szt każdego rozmiaru\n- Cena: 120 PLN\nSkład: Sklep Wędkarski Warszawa',
      source: 'text',
      language: 'pl',
      aiResponse: null
    });

    await Note.create({
      userId: user.id,
      noteCategoryId: categoryHobbyWedkarstwo.id,
      noteSubCategoryId1: subLowiska.id,
      noteSubCategoryId2: null,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['łowisko', 'zalew', 'rekonesans'],
      content: 'Zalew Zegrzyński - rekonesans 13.01.2025:\n- Temperatura wody: 4°C\n- Przejrzystość: dobra\n- Aktywność ryb: niska (zima)\n- Dobre stanowiska: przy pomoście nr 3\nWnioski: Wrócić na wiosnę!',
      source: 'voice',
      language: 'pl',
      aiResponse: 'Zalecenia: Najlepszy okres na ten zalew to kwiecień-czerwiec. Temperatura wody optymalna powyżej 12°C.'
    });

    // Notatka dla Osobiste (bez subkategorii)
    await Note.create({
      userId: user.id,
      noteCategoryId: categoryOsobiste.id,
      noteSubCategoryId1: null,
      noteSubCategoryId2: null,
      noteSubCategoryId3: null,
      noteSubCategoryId4: null,
      noteSubCategoryId5: null,
      tags: ['notatka', 'pomysł'],
      content: 'Pomysły na weekend:\n- Porządki w garażu\n- Zakupy spożywcze\n- Wizyta u rodziny\n- Film w kinie z przyjaciółmi',
      source: 'text',
      language: 'pl',
      aiResponse: null
    });

    console.log('✅ Utworzono 9 przykładowych notatek\n');

    // 7. Podsumowanie
    console.log('📊 PODSUMOWANIE:\n');
    console.log(`👤 Użytkownik: test@example.com / test123`);
    console.log(`📁 Kategorie: 4`);
    console.log(`   - Praca (💼) - 13 subkategorii w hierarchii`);
    console.log(`   - Hobby - Piłka nożna (⚽) - 4 subkategorie`);
    console.log(`   - Hobby - Wędkarstwo (🎣) - 4 subkategorie`);
    console.log(`   - Osobiste (🏠) - 0 subkategorii`);
    console.log(`📝 Notatki: 9\n`);

    console.log('🎯 PRZYKŁADOWA HIERARCHIA DLA "PRACA":\n');
    console.log('📁 Praca');
    console.log('  ├─ 🏢 Klient ABC (poziom 1)');
    console.log('  │   ├─ 📄 Faktury zakupu (poziom 2)');
    console.log('  │   │   ├─ 💰 Zakup usług (poziom 3) [ODBLOKOWANE]');
    console.log('  │   │   │   └─ 🧹 Czyszczenie komputera (poziom 4) [ZABLOKOWANE]');
    console.log('  │   │   └─ 📦 Zakup towarów (poziom 3) [ZABLOKOWANE]');
    console.log('  │   ├─ 💵 Faktury sprzedaży (poziom 2)');
    console.log('  │   └─ 🤝 Spotkania (poziom 2)');
    console.log('  ├─ 🏢 Klient XYZ (poziom 1)');
    console.log('  └─ 💼 Projekty wewnętrzne (poziom 1)');
    console.log('      └─ 🚀 Projekt Alpha (poziom 2)\n');

    console.log('✨ Seedowanie zakończone sukcesem!\n');
    console.log('🧪 TESTUJ API:');
    console.log('1. Zaloguj się: POST /api/auth/login');
    console.log('   { "email": "test@example.com", "password": "test123" }');
    console.log('2. Skopiuj token z odpowiedzi');
    console.log('3. Dodaj nagłówek: Authorization: Bearer <token>');
    console.log('4. Testuj endpointy z API_ENDPOINTS.md\n');

  } catch (error) {
    console.error('❌ Błąd podczas seedowania:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Uruchom seed
seed();
