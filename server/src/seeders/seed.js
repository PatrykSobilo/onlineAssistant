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

    const subPrzynety = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyWedkarstwo.id,
      parentSubCategoryId: subSprzet.id,
      level: 2,
      name: 'Przynęty',
      isActive: true,
      isUnlocked: true
    });

    const subTechniki = await NoteSubCategory.create({
      userId: user.id,
      categoryId: categoryHobbyWedkarstwo.id,
      parentSubCategoryId: null,
      level: 1,
      name: 'Techniki',
      isActive: true,
      isUnlocked: true
    });

    console.log('✅ Utworzono 6 subkategorii dla Wędkarstwo\n');

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

    // Dodaj więcej szczegółowych notatek testowych
    console.log('📝 Tworzenie dodatkowych 50 notatek testowych...');

    const additionalNotes = [
      // PRACA - Klient ABC - Faktury zakupu (10 notatek)
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        tags: ['faktura', 'papier', '2025'],
        content: 'Faktura FV/002/2025 - zakup papieru A4 i tuszy do drukarek.\n- Papier A4: 20 ryz × 15 PLN = 300 PLN\n- Tusz czarny HP: 5 szt × 80 PLN = 400 PLN\n- Tusz kolorowy HP: 3 szt × 120 PLN = 360 PLN\nRazem: 1060 PLN netto\nTermin: 14 dni',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        noteSubCategoryId3: subZakupUslugi.id,
        tags: ['usługa', 'hosting', 'cloud'],
        content: 'Faktura za usługi hostingowe styczeń 2025:\n- AWS EC2: $450/miesiąc\n- S3 Storage: $89/miesiąc\n- CloudFront CDN: $120/miesiąc\nRazem: $659 (około 2700 PLN)\nAuto-renewal: TAK',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        tags: ['faktura', 'licencja', 'oprogramowanie'],
        content: 'Faktura FV/003/2025 - odnowienie licencji Microsoft 365:\n- Office 365 Business Premium: 10 licencji × 65 PLN = 650 PLN/miesiąc\n- Power BI Pro: 3 licencje × 45 PLN = 135 PLN/miesiąc\nPeriod: roczny (płatność miesięczna)',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        tags: ['faktura', 'sprzęt', 'laptop'],
        content: 'Zakup nowego laptopa dla działu IT:\n- Model: Dell Latitude 5540\n- Procesor: Intel i7-1365U\n- RAM: 32GB DDR5\n- Dysk: 1TB NVMe SSD\n- Cena: 5999 PLN netto\nGwarancja: 3 lata on-site\nData zakupu: 10.01.2025',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        tags: ['faktura', 'kawa', 'biuro'],
        content: 'Faktura FV/004/2025 - zakupy do biura kuchennego:\n- Kawa ziarnista Lavazza: 10kg × 90 PLN = 900 PLN\n- Mleko UHT: 24 szt × 3.50 PLN = 84 PLN\n- Cukier: 5kg × 8 PLN = 40 PLN\n- Herbaty różne: 150 PLN\nRazem: 1174 PLN',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        noteSubCategoryId3: subZakupUslugi.id,
        tags: ['usługa', 'szkolenie', 'security'],
        content: 'Szkolenie z cyberbezpieczeństwa - 15.01.2025:\n- Temat: "Security Best Practices 2025"\n- Prowadzący: SecureTech Solutions\n- Liczba uczestników: 12 osób\n- Koszt: 4800 PLN netto (400 PLN/osoba)\n- Certyfikaty: TAK\nOcena: 9.2/10',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        tags: ['faktura', 'paliwo', 'samochód'],
        content: 'Karta paliwowa - rozliczenie grudzień 2024:\n- Samochód 1 (VW Passat): 850 litrów = 5950 PLN\n- Samochód 2 (Toyota Corolla): 620 litrów = 4340 PLN\n- Samochód 3 (Ford Transit): 1200 litrów = 8400 PLN\nRazem: 18690 PLN\nŚrednia cena: 7.00 PLN/litr',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        tags: ['faktura', 'marketing', 'reklama'],
        content: 'Faktura za kampanię Google Ads - styczeń 2025:\n- Budżet dzienny: 500 PLN\n- Okres: 1-31 stycznia\n- Całkowity koszt: 15500 PLN\n- Kliknięcia: 3420\n- CPC średni: 4.53 PLN\n- Konwersje: 67\nROI: 340%',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        tags: ['faktura', 'meble', 'biuro'],
        content: 'Zakup mebli biurowych dla nowego stanowiska:\n- Biurko regulowane elektrycznie: 2400 PLN\n- Fotel ergonomiczny Herman Miller: 4200 PLN\n- Lampka biurkowa LED: 350 PLN\n- Organizer na biurko: 180 PLN\nRazem: 7130 PLN\nDostawa: 22.01.2025',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subFakturyZakupu.id,
        noteSubCategoryId3: subZakupUslugi.id,
        tags: ['usługa', 'księgowość', 'audyt'],
        content: 'Usługa księgowa - kwartał Q4 2024:\n- Prowadzenie KPiR: 1200 PLN/mc × 3 = 3600 PLN\n- Deklaracje VAT: 300 PLN × 3 = 900 PLN\n- Rozliczenie roczne PIT/CIT: 2500 PLN\n- Audyt wewnętrzny: 1800 PLN\nRazem: 8800 PLN',
        source: 'text',
        language: 'pl'
      },

      // PRACA - Klient ABC - Spotkania (8 notatek)
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'review', 'q4'],
        content: 'Spotkanie podsumowujące Q4 2024 - 08.01.2025:\n- Realizacja budżetu: 104% (przekroczenie o 4%)\n- Najlepiej sprzedający się produkt: Moduł CRM\n- Nowi klienci: 23\n- Churn rate: 2.1% (niższy niż planowano)\nDecyzja: Zwiększyć zespół o 2 osoby w Q1',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'roadmap', '2025'],
        content: 'Planowanie roadmapy produktowej 2025:\n- Q1: Redesign interfejsu użytkownika\n- Q2: Integracja z WhatsApp Business\n- Q3: Moduł raportowania zaawansowanego\n- Q4: AI Assistant (beta)\nBudżet R&D: 450 000 PLN rocznie',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'rekrutacja', 'hr'],
        content: 'Spotkanie HR - potrzeby rekrutacyjne:\n- Backend Developer (Senior): 2 osoby, start: luty 2025\n- Frontend Developer (Mid): 1 osoba, start: marzec 2025\n- UX Designer: 1 osoba (umowa B2B), start: kwiecień 2025\n- DevOps Engineer: 1 osoba, ASAP\nBudżet: 85 000 PLN/mc (wszystkie etaty)',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'partner', 'negocjacje'],
        content: 'Negocjacje z partnerem technologicznym - TechVendor Ltd:\n- Rabat wolumenowy: 15% przy zamówieniach >50k PLN/rok\n- Wydłużony termin płatności: 45 dni (zamiast 30)\n- Dedykowany account manager: TAK\n- Priorytetowe wsparcie techniczne: 24/7\nDecyzja: PRZYJĘTO, podpisanie umowy: 25.01.2025',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'klient', 'demo'],
        content: 'Prezentacja demo dla potencjalnego klienta - BigCorp S.A.:\n- Data: 16.01.2025\n- Obecni: CEO, CTO, Head of Sales (ich strona)\n- Demonstrowane funkcje: Dashboard, Reporting, API\n- Feedback: bardzo pozytywny!\n- Kolejny krok: propozycja cenowa do 20.01\nSzansa na deal: 80%',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'crisis', 'problem'],
        content: 'Spotkanie kryzysowe - awaria serwera produkcyjnego:\n- Data incydentu: 17.01.2025, 03:15\n- Czas przestoju: 2h 47min\n- Przyczyna: Przepełnienie dysku (brak monitoringu)\n- Rozwiązanie: Zwiększono przestrzeń, naprawiono monitoring\n- Straty: ~15 000 PLN (SLA penalty)\nAkcje: Audyt infrastruktury do 31.01',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'team', 'brainstorming'],
        content: 'Brainstorming - pomysły na nowe funkcje:\n- Chatbot AI dla supportu (głosów: 9/12)\n- Dark mode w aplikacji (głosów: 11/12)\n- Integracja z Zapier (głosów: 7/12)\n- Mobile app natywna (głosów: 10/12)\nPriorytet 1: Dark mode + Mobile app\nStart prac: Q2 2025',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subKlientABC.id,
        noteSubCategoryId2: subSpotkania.id,
        tags: ['spotkanie', 'security', 'compliance'],
        content: 'Spotkanie z audytorem bezpieczeństwa:\n- Przeprowadzono: Penetration testing\n- Znalezione luki: 3 średnie, 12 niskie, 0 krytyczne\n- Certyfikat ISO 27001: W trakcie (zakończenie: marzec 2025)\n- RODO compliance: OK\n- Backup procedure: Wymaga poprawy\nKoszt naprawy luk: ~8000 PLN',
        source: 'text',
        language: 'pl'
      },

      // PRACA - Projekty -> Projekt Alpha (7 notatek)
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subProjekty.id,
        noteSubCategoryId2: subProjektAlpha.id,
        tags: ['projekt', 'sprint', 'planning'],
        content: 'Sprint Planning - Sprint 12:\n- Cel: Dokończyć moduł płatności\n- Story points do zrobienia: 34\n- Team velocity: 29 (średnia z 3 ostatnich sprintów)\n- Ryzyko: Integracja z PayU może potrwać dłużej\n- Sprint review: 31.01.2025',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subProjekty.id,
        noteSubCategoryId2: subProjektAlpha.id,
        tags: ['projekt', 'bug', 'critical'],
        content: 'CRITICAL BUG #2847 - Utrata danych w formularzu:\n- Priorytet: P0 (najwyższy)\n- Opisany przez: Klient BigRetail\n- Kroki do reprodukcji: Zapisane w Jira\n- Assigned: Jan Kowalski (Backend Lead)\n- ETA fix: dziś do 18:00\n- Workaround: Tymczasowo wyłączono autosave',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subProjekty.id,
        noteSubCategoryId2: subProjektAlpha.id,
        tags: ['projekt', 'deploy', 'production'],
        content: 'Deploy na produkcję - v2.4.0:\n- Data: 18.01.2025, 22:00 (noc)\n- Zmiany: 47 commitów, 23 PR merged\n- Nowe funkcje: Export do Excel, Bulk edit\n- Bug fixes: 15\n- Database migration: TAK (czas: ~12 min)\n- Rollback plan: Przygotowany\nStatus: SUCCESS ✅',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subProjekty.id,
        noteSubCategoryId2: subProjektAlpha.id,
        tags: ['projekt', 'performance', 'optimization'],
        content: 'Optymalizacja wydajności - wyniki:\n- Czas ładowania strony głównej: 3.2s → 0.9s (72% lepiej)\n- API response time: 450ms → 120ms (73% lepiej)\n- Użyty cache Redis: TAK\n- Lazy loading obrazów: Zaimplementowane\n- Bundle size: Zmniejszony o 40%\nFeedback użytkowników: Bardzo pozytywny!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subProjekty.id,
        noteSubCategoryId2: subProjektAlpha.id,
        tags: ['projekt', 'documentation', 'api'],
        content: 'Dokumentacja API - update:\n- Dodano: 12 nowych endpointów\n- Poprawiono: 8 przykładów kodu\n- Swagger UI: Zaktualizowane\n- Postman Collection: Export gotowy\n- Video tutorial: Nagrany (15 min)\nLink: docs.ourproject.com/api/v2',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subProjekty.id,
        noteSubCategoryId2: subProjektAlpha.id,
        tags: ['projekt', 'testing', 'qa'],
        content: 'Raport QA - tydzień 3/2025:\n- Testy manualne: 234 test cases executed\n- Testy automatyczne: 1847 tests (98.4% pass rate)\n- Znalezione bugi: 17 (8 low, 7 medium, 2 high, 0 critical)\n- Coverage: 84% (cel: 85%)\n- Regresja: Brak problemów\nRekomendacja: GO dla release',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryPraca.id,
        noteSubCategoryId1: subProjekty.id,
        noteSubCategoryId2: subProjektAlpha.id,
        tags: ['projekt', 'retrospective', 'team'],
        content: 'Retrospektywa Sprint 11:\n✅ Co poszło dobrze:\n- Dobra komunikacja w teamie\n- Code review na czas\n- Mało bugów na produkcji\n\n❌ Co można poprawić:\n- Daily standupy za długie (15min → 10min)\n- Dokumentacja zapóźniona\n- Braki w testach E2E\n\nAkcje: Shorter dailies, Doc day Friday',
        source: 'voice',
        language: 'pl'
      },

      // HOBBY - PIŁKA NOŻNA (10 notatek)
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subTrening.id,
        noteSubCategoryId2: subBieganie.id,
        tags: ['trening', 'bieganie', 'interwały'],
        content: 'Trening interwałowy 16.01.2025:\n- Rozgrzewka: 10 min\n- 6× (400m sprint + 200m marsz)\n- Tempo sprintów: 3:45 min/km\n- Czas regeneracji: 90 sekund\n- Zakwaszenie: Wysokie\n- Cool down: 5 min\nOcena: Ciężki ale efektywny!',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subTrening.id,
        noteSubCategoryId2: subBieganie.id,
        tags: ['trening', 'długi', 'endurance'],
        content: 'Długi bieg 13.01.2025:\n- Dystans: 15 km\n- Czas: 1h 22min\n- Tempo: 5:28 min/km\n- Elevation: 180m\n- Kalorie: 1240 kcal\n- Temperatura: -2°C\nTrasa: Park → Las → Zalew → Powrót',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subTrening.id,
        noteSubCategoryId2: subSilownia.id,
        tags: ['trening', 'siłownia', 'nogi'],
        content: 'Trening nóg - dzień 1 (15.01.2025):\n- Przysiady ze sztangą: 4×8 (100kg)\n- Martwy ciąg rumuński: 3×10 (80kg)\n- Leg press: 3×12 (180kg)\n- Lunges z hantlami: 3×12 (2×20kg)\n- Prostowanie nóg: 3×15\nCzas: 75 minut\nSamopoczucie: Świetne!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subTrening.id,
        noteSubCategoryId2: subSilownia.id,
        tags: ['trening', 'siłownia', 'górna'],
        content: 'Trening górnej partii - 17.01.2025:\n- Wyciskanie sztangi: 4×8 (85kg)\n- Podciąganie: 4×12 (własna masa)\n- Wiosłowanie hantlami: 3×10 (2×28kg)\n- Facepulls: 3×15\n- Biceps curl: 3×12\n- Triceps pushdown: 3×12\nPompa niesamowita!',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subMecze.id,
        tags: ['mecz', 'liga', 'wygrana'],
        content: 'Mecz ligowy 15.01.2025: FC Lokals vs Blue Eagles\nWynik: 4:2 (wygrana!)\n- Mój występ: 90 minut\n- Moje gole: 1 (37\')\n- Asysty: 2 (12\', 68\')\n- Kartki: Żółta (78\' - faul taktyczny)\n- MVP meczu: Kapitan Marek\nKlasyfikacja: 3. miejsce (12 pkt)',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subMecze.id,
        tags: ['mecz', 'puchar', 'przegrana'],
        content: 'Puchar Polski - 1/16 finału - 11.01.2025:\nFC Lokals vs Górnik City\nWynik: 1:3 (przegrana)\n- Bolesna porażka\n- Graliśmy dobrze pierwsze 60 minut (1:1)\n- Potem spadek formy i 2 gole stracone\n- Mój występ: 78 minut (zmieniony)\nWnioski: Brak kondycji w końcówce',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subMecze.id,
        tags: ['mecz', 'analiza', 'video'],
        content: 'Analiza video meczu vs Blue Eagles:\n- Moje pozycjonowanie: 7/10 (do poprawy)\n- Pressing: Dobry w pierwszej połowie\n- Podania: 42/48 celnych (87.5%)\n- Strzały: 3 (1 na bramkę, 1 gol)\n- Dryblingi: 5/7 udanych\nNotatka: Popracować nad strzałami z dystansu',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subSprzet.id,
        tags: ['sprzęt', 'korki', 'zakup'],
        content: 'Zakup nowych korków:\n- Model: Nike Mercurial Vapor 15\n- Rozmiar: 43\n- Kolor: Czarno-zielone\n- Cena: 599 PLN (promocja -30%)\n- Kupione: Decathlon Warszawa\n- Data: 09.01.2025\nFirst impression: Lekkie i wygodne!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subSprzet.id,
        tags: ['sprzęt', 'strój', 'koszulka'],
        content: 'Nowy strój treningowy:\n- Koszulka Adidas Climacool: 2 szt × 120 PLN = 240 PLN\n- Spodenki treningowe: 3 szt × 80 PLN = 240 PLN\n- Getry kompresyjne: 2 pary × 60 PLN = 120 PLN\n- Ochraniacze Nike: 89 PLN\nRazem: 689 PLN\nJakość: Premium',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyPilka.id,
        noteSubCategoryId1: subSprzet.id,
        tags: ['sprzęt', 'akcesoria', 'piłka'],
        content: 'Zakup piłek treningowych:\n- Piłka Adidas Tango (rozmiar 5): 3 szt × 140 PLN = 420 PLN\n- Pompka dwukierunkowa: 45 PLN\n- Igły zapasowe: 15 PLN\n- Torba na piłki: 80 PLN\nRazem: 560 PLN\nMiejsce: SportMax Outlet',
        source: 'text',
        language: 'pl'
      },

      // HOBBY - WĘDKARSTWO (8 notatek)
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subLowiska.id,
        tags: ['łowisko', 'rzeka', 'szczupak'],
        content: 'Wędkowanie na Wiśle - 14.01.2025:\n- Miejsce: Płock, okolice mostu\n- Czas: 6:00-14:00 (8h)\n- Złowione: 2 szczupaki (58cm i 62cm), 1 okoń (32cm)\n- Przynęta: Wobler rapala + guma shad\n- Pogoda: Pochmurno, -1°C\n- Woda: Zimna, przejrzysta\nDzień udany!',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subLowiska.id,
        tags: ['łowisko', 'staw', 'karp'],
        content: 'Łowisko Karpik - sesja nocna 12-13.01.2025:\n- Czas: 18:00-08:00 (14h)\n- Złowione: 3 karpie (4.5kg, 6.2kg, 8.1kg)\n- Przynęta: Boilies truskawkowe 20mm\n- Zanęta: Pellet + kukurydza\n- Metoda: Method feeder\n- Pogoda: Mroźna noc (-5°C)\nNajlepszy karp sezonu!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subLowiska.id,
        tags: ['łowisko', 'jezioro', 'troć'],
        content: 'Jezioro Mazurskie - wyprawy weekend:\n- Data: 13-14.01.2025\n- Miejsce: Jezioro Śniardwy\n- Złowione: 1 troć (2.3kg), 4 okonie, 2 leszcze\n- Metoda: Spinning + gruntowa\n- Noclegi: Chatka nad jeziorem (200 PLN/noc)\n- Pogoda: Śnieg, wiatr\nPiękne widoki!',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subSprzet.id,
        noteSubCategoryId2: subWedki.id,
        tags: ['sprzęt', 'wędka', 'zakup'],
        content: 'Zakup nowej wędki spinningowej:\n- Model: Shimano Catana CX 270MH\n- Długość: 2.70m\n- Test: 14-40g\n- Cena: 389 PLN\n- Kołowrotek: Daiwa Ninja 3000 (dodatkowe 299 PLN)\n- Sklep: Wędkarski Raj\nData: 10.01.2025\nJakość: Świetna!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subSprzet.id,
        noteSubCategoryId2: subPrzynety.id,
        tags: ['sprzęt', 'przynęty', 'woblery'],
        content: 'Zakup przynęt - styczeń 2025:\n- Woblery Rapala: 6 szt × 45 PLN = 270 PLN\n- Gumy Relax Kopyto: 10 opak × 18 PLN = 180 PLN\n- Błystki obrotowe Mepps: 8 szt × 22 PLN = 176 PLN\n- Jigheady: 20 szt (mikser) = 60 PLN\nRazem: 686 PLN',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subSprzet.id,
        tags: ['sprzęt', 'torba', 'akcesoria'],
        content: 'Nowa torba wędkarska:\n- Model: Jaxon Premium 3-komorowa\n- Wymiary: 70×30×35cm\n- Kieszenie: 8 zewnętrznych\n- Wodoodporna: TAK\n- Cena: 299 PLN\n- Dodatki: Organizery na przynęty (3 szt) = 75 PLN\nRazem: 374 PLN\nWygodna i pojemna!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subTechniki.id,
        tags: ['technika', 'spinning', 'tutorial'],
        content: 'Nauka techniki jerkowania:\n- Oglądany tutorial: "Modern Jerk Techniques"\n- Kanał: Fishing Adventure PL\n- Długość: 25 minut\n- Kluczowe punkty:\n  * Szarpnięcia co 1-2 sekundy\n  * Przerwy 3-5 sekund\n  * Różne amplitudy ruchu\n- Praktyka: 15.01 nad stawem\nEfekt: 2 szczupaki złowione!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryHobbyWedkarstwo.id,
        noteSubCategoryId1: subTechniki.id,
        tags: ['technika', 'gruntowa', 'karp'],
        content: 'Kurs wędkarstwa karpiowego - notatki:\n- Data: 11.01.2025 (warsztat online)\n- Prowadzący: Mistrz Polski 2024\n- Tematy:\n  * Dobór zanęty do temperatury wody\n  * Method feeder vs PVA bag\n  * Montaże przeciwzaplątaniowe\n  * Strategia lokalizacji karpia zimą\n- Koszt: 120 PLN\nWartościowe info!',
        source: 'voice',
        language: 'pl'
      },

      // OSOBISTE (7 notatek)
      {
        noteCategoryId: categoryOsobiste.id,
        tags: ['zakupy', 'lista', 'spożywcze'],
        content: 'Lista zakupów - tydzień 3/2025:\n- Pieczywo: chleb, bułki, bagietka\n- Nabiał: mleko 6L, jogurty, ser żółty, masło\n- Mięso: Kurczak 2kg, wieprzowina 1.5kg\n- Warzywa: Pomidory, ogórki, papryka, sałata\n- Owoce: Banany, jabłka, pomarańcze\n- Inne: Ryż, makaron, olej, przyprawy\nSzacowany koszt: 350 PLN',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryOsobiste.id,
        tags: ['zdrowie', 'lekarz', 'wizyta'],
        content: 'Wizyta u lekarza - 16.01.2025:\n- Specjalista: Ortopeda\n- Problem: Ból kolana po treningu\n- Diagnoza: Lekkie przeciążenie ścięgna\n- Zalecenia:\n  * Odpoczynek 7 dni\n  * Lód 3×20min dziennie\n  * Maść przeciwbólowa\n  * Rehabilitacja (skierowanie)\n- Koszt wizyty: 250 PLN\nKontrolna: 30.01.2025',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryOsobiste.id,
        tags: ['auto', 'przegląd', 'serwis'],
        content: 'Przegląd samochodu - 09.01.2025:\n- Auto: Toyota Corolla 2019\n- Przebieg: 87 450 km\n- Wykonano:\n  * Wymiana oleju + filtr\n  * Wymiana klocków hamulcowych przód\n  * Wymiana płynu hamulcowego\n  * Kontrola zawieszenia (OK)\n- Koszt: 890 PLN\n- Następny przegląd: Lipiec 2025 lub 95 000 km',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryOsobiste.id,
        tags: ['książka', 'czytanie', 'rozwój'],
        content: 'Przeczytana książka: "Atomic Habits" - James Clear:\n- Data ukończenia: 14.01.2025\n- Ocena: 9/10\n- Kluczowe wnioski:\n  * Małe nawyki = wielkie efekty\n  * System > cele\n  * Łatwość = klucz do sukcesu\n  * Identity-based habits\n- Zastosowanie: Codzienne 15 min czytania o 7 rano\nPolecam!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryOsobiste.id,
        tags: ['finanse', 'oszczędności', 'plan'],
        content: 'Plan oszczędnościowy 2025:\n- Cel: 30 000 PLN do końca roku\n- Miesięczne odłożenie: 2500 PLN\n- Metoda: Transfer automatyczny 1. dnia miesiąca\n- Konto: ING Oszczędnościowe (3.5% rocznie)\n- Progress styczeń: 2500/2500 PLN ✅\n- Razem zebrane: 2500 PLN\nDyscyplina!',
        source: 'text',
        language: 'pl'
      },
      {
        noteCategoryId: categoryOsobiste.id,
        tags: ['dom', 'remont', 'plany'],
        content: 'Plany remontowe - Q1 2025:\n- Łazienka: Wymiana płytek + armatura (marzec)\n- Kuchnia: Nowe blaty + zlewozmywak (kwiecień)\n- Salon: Malowanie + nowa kanapa (maj)\n- Szacowany koszt: 25 000 PLN\n- Wykonawcy: 3 firmy do wyceny\n- Start: Marzec 2025\nCzas na odświeżenie mieszkania!',
        source: 'voice',
        language: 'pl'
      },
      {
        noteCategoryId: categoryOsobiste.id,
        tags: ['wakacje', 'urlop', 'podróż'],
        content: 'Planowanie wakacji 2025:\n- Termin: 15-30 lipca (16 dni)\n- Destynacja: Grecja - Kreta\n- Hotel: 4* all-inclusive\n- Lot: Warszawa-Heraklion (bezpośredni)\n- Rezerwacja: Do 31 stycznia (early booking -20%)\n- Szacowany koszt: 7500 PLN na osobę\n- Osoby: 2\nRazem: ~15 000 PLN',
        source: 'text',
        language: 'pl'
      }
    ];

    for (const noteData of additionalNotes) {
      await Note.create({
        userId: user.id,
        ...noteData,
        noteSubCategoryId2: noteData.noteSubCategoryId2 || null,
        noteSubCategoryId3: noteData.noteSubCategoryId3 || null,
        noteSubCategoryId4: noteData.noteSubCategoryId4 || null,
        noteSubCategoryId5: noteData.noteSubCategoryId5 || null,
        aiResponse: noteData.aiResponse || null
      });
    }

    console.log('✅ Utworzono dodatkowe 50 notatek testowych\n');

    // 7. Podsumowanie
    console.log('📊 PODSUMOWANIE:\n');
    console.log(`👤 Użytkownik: test@example.com / test123`);
    console.log(`📁 Kategorie: 4`);
    console.log(`   - Praca (💼) - 13 subkategorii w hierarchii`);
    console.log(`   - Hobby - Piłka nożna (⚽) - 4 subkategorie`);
    console.log(`   - Hobby - Wędkarstwo (🎣) - 4 subkategorie`);
    console.log(`   - Osobiste (🏠) - 0 subkategorii`);
    console.log(`📝 Notatki: 59\n`);

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
