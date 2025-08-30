# Cardiologie Taakbeheer

Een ADHD-vriendelijke, GDPR-compliant taakbeheersysteem speciaal ontwikkeld voor cardiologie assistenten en AIOS.

## ✨ Hoofdfuncties

### 🎯 ADHD-Vriendelijk Ontwerp
- **Eenvoudige interface** met minimale cognitieve belasting
- **Één-klik taak aanmaak** met voorgedefinieerde sjablonen
- **Visuele prioriteiten** en kleurcodering
- **Snelle status updates** zonder complexe menu's

### 🎤 Spraakherkenning (OpenAI Whisper)
- **Nederlandse spraakherkenning** met medische terminologie
- **Intelligente correcties** door persoonlijk woordenboek
- **Audio opslag** voor verificatie van transcripties
- **Offline-first** benadering voor privacy

### 📱 OCR Patiëntgegevens
- **Lokale OCR verwerking** (Tesseract.js) - geen externe API's
- **Automatische herkenning** van patiënt ID en geboortedatum
- **Camera integratie** voor directe scanning
- **GDPR-compliant** - geen data verlaat je apparaat

### 🔒 GDPR Compliance
- **Automatische data verwijdering** na 72 uur
- **Lokale opslag** - geen externe servers
- **Geen patiënt identificeerbare informatie** opslag
- **Transparante data beheer** met retention dashboard

## 🏥 Medische Sjablonen

Voorgedefinieerde sjablonen voor veelvoorkomende taken:
- **Cardiologie Consult** - Voor andere specialismen
- **Cathlab Rapport** - Procedure documentatie
- **Echo Onderzoek** - TTE/TEE rapportage
- **Uitslagen Opvolging** - Lab/beeldvorming follow-up
- **Patiënt Contact** - Telefonische consultatie
- **MDO Voorbereiding** - Multidisciplinair overleg

## 🚀 Technische Specificaties

### Frontend
- **React 19** met moderne hooks
- **Tailwind CSS** voor responsive design
- **Lucide Icons** voor consistente iconografie
- **Dexie.js** voor lokale database (IndexedDB)

### AI & Machine Learning
- **OpenAI Whisper API** voor spraak-naar-tekst
- **Tesseract.js** voor lokale OCR verwerking
- **Intelligente woordenboek** met leeralgoritme
- **Context-bewuste suggesties**

### Privacy & Security
- **Client-side verwerking** - geen server-side data
- **Automatische cleanup** na 72 uur
- **Encrypted lokale opslag**
- **Geen tracking of analytics**

## 📦 Installatie & Deployment

### Lokale Ontwikkeling
```bash
# Clone repository
git clone https://github.com/jdverbek/cardio-task-manager.git
cd cardio-task-manager

# Installeer dependencies
pnpm install

# Start development server
pnpm run dev
```

### Productie Deployment (Render)
1. **Fork** deze repository naar je eigen GitHub account
2. **Connect** je GitHub account met Render
3. **Create** nieuwe Static Site op Render
4. **Configure** build settings:
   - Build Command: `pnpm run build`
   - Publish Directory: `dist`
5. **Deploy** automatisch bij elke push naar main branch

### Environment Variables
```env
# OpenAI API Key (optioneel - kan ook in-app worden ingesteld)
VITE_OPENAI_API_KEY=sk-proj-...
```

## 🔧 Configuratie

### OpenAI API Key
1. Ga naar [OpenAI Platform](https://platform.openai.com/api-keys)
2. Maak een nieuwe API key aan
3. Voer de key in via de app instellingen
4. Key wordt lokaal opgeslagen (niet gedeeld)

### Spraakherkenning Optimalisatie
- **Nederlandse taal** wordt automatisch gedetecteerd
- **Medische termen** worden geleerd en verbeterd
- **Persoonlijk woordenboek** kan worden geëxporteerd/geïmporteerd
- **Audio kwaliteit** optimalisatie voor beste resultaten

## 📱 Gebruik

### Nieuwe Taak Aanmaken
1. **Klik** op "Nieuwe Taak" knop
2. **Selecteer** een sjabloon of start leeg
3. **Gebruik spraak** 🎤 voor snelle invoer
4. **Scan patiëntgegevens** 📷 indien nodig
5. **Sla op** - taak verschijnt in dashboard

### Spraak Invoer
1. **Klik** op microfoon icoon bij elk tekstveld
2. **Spreek** duidelijk in het Nederlands
3. **Controleer** transcriptie en audio
4. **Pas aan** indien nodig via suggesties
5. **Gebruik** de tekst in je taak

### OCR Scanning
1. **Open** OCR scanner via "Scannen" knop
2. **Maak foto** van patiëntkaart/ID-band
3. **Controleer** geëxtraheerde gegevens
4. **Gebruik** automatisch ingevulde velden

## 🔐 Privacy & GDPR

### Data Verwerking
- **Lokaal**: Alle data blijft op je apparaat
- **Geen servers**: Geen externe opslag van patiëntgegevens
- **Automatisch wissen**: Data verdwijnt na 72 uur
- **Transparant**: Volledige controle over je gegevens

### Compliance Features
- **Data retention dashboard** met overzicht
- **Handmatige cleanup** optie beschikbaar
- **Export functionaliteit** voor backup
- **Audit trail** van data verwijderingen

## 🤝 Bijdragen

Bijdragen zijn welkom! Zie [CONTRIBUTING.md](CONTRIBUTING.md) voor richtlijnen.

### Development Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
pnpm run test

# Build for production
pnpm run build
```

## 📄 Licentie

MIT License - zie [LICENSE](LICENSE) bestand voor details.

## 🆘 Support

Voor vragen of problemen:
- **GitHub Issues**: [Open een issue](https://github.com/jdverbek/cardio-task-manager/issues)
- **Documentatie**: Zie de [Wiki](https://github.com/jdverbek/cardio-task-manager/wiki)

## 🙏 Dankbetuigingen

- **OpenAI** voor Whisper API
- **Tesseract.js** team voor OCR capabilities
- **React** en **Vite** communities
- **Cardiologie gemeenschap** voor feedback en requirements

---

**Gemaakt met ❤️ voor cardiologie professionals**

*Versie 2.0 - Met spraakherkenning, OCR en verbeterde GDPR compliance*

