-- =============================================================================
-- [NOME_APP] — Seed templates (Batch A)
-- 15 template di progetto realistici (3 per verticale × 5 verticali).
-- I default_milestones sono array di {title, description, default_amount_pct}.
-- Le percentuali sommano a 100 per ogni template "deliverable".
-- I template "recurring" hanno default_milestones = [].
-- =============================================================================

insert into public.templates (vertical, name, description, default_milestones, default_total_amount, is_official) values

-- ============================== WEB DEV ======================================
('web_dev',
 'Sito vetrina 5 pagine',
 'Sito statico responsive con 5 pagine: home, chi siamo, servizi, contatti, blog.',
 $json$[
   {"title":"Brief e sitemap","description":"Allineamento contenuti, struttura, riferimenti grafici.","default_amount_pct":15},
   {"title":"Mockup approvato","description":"Wireframe e design ad alta fedeltà delle pagine chiave.","default_amount_pct":25},
   {"title":"Sviluppo frontend","description":"Implementazione responsive, componenti, animazioni.","default_amount_pct":30},
   {"title":"Contenuti e SEO base","description":"Inserimento testi, immagini ottimizzate, meta tag.","default_amount_pct":15},
   {"title":"Deploy e QA","description":"Pubblicazione su dominio, test cross-browser, formazione cliente.","default_amount_pct":15}
 ]$json$::jsonb,
 3500.00,
 true),

('web_dev',
 'E-commerce Shopify',
 'Negozio online completo su Shopify con configurazione catalogo, pagamenti e spedizioni.',
 $json$[
   {"title":"Brief e architettura store","description":"Definizione catalogo, varianti, flusso di acquisto.","default_amount_pct":15},
   {"title":"Setup Shopify e tema","description":"Tema personalizzato, sezioni custom, branding.","default_amount_pct":25},
   {"title":"Catalogo prodotti","description":"Inserimento prodotti, foto, descrizioni, varianti.","default_amount_pct":20},
   {"title":"Pagamenti e spedizioni","description":"Integrazione gateway, configurazione corrieri, tasse.","default_amount_pct":20},
   {"title":"Deploy e formazione","description":"Go-live, formazione gestione ordini, documentazione.","default_amount_pct":20}
 ]$json$::jsonb,
 6000.00,
 true),

('web_dev',
 'App mobile MVP',
 'Sviluppo MVP app mobile cross-platform (iOS+Android) per validare il prodotto.',
 $json$[
   {"title":"Discovery e specifiche","description":"User stories, definizione MVP scope, mockup.","default_amount_pct":15},
   {"title":"Design UI/UX","description":"Sistema di design, prototipo interattivo, validazione.","default_amount_pct":20},
   {"title":"Sviluppo core","description":"Implementazione feature MVP, integrazioni base.","default_amount_pct":35},
   {"title":"Test e refinement","description":"QA interna, beta test ristretta, fix.","default_amount_pct":15},
   {"title":"Pubblicazione store","description":"Build di produzione, submission App Store e Play Store.","default_amount_pct":15}
 ]$json$::jsonb,
 8000.00,
 true),

-- ============================== ARCHITECT ====================================
('architect',
 'Ristrutturazione residenziale',
 'Progetto completo ristrutturazione: dal preliminare alla direzione lavori.',
 $json$[
   {"title":"Sopralluogo e rilievi","description":"Misurazione, fotografie, documentazione stato di fatto.","default_amount_pct":10},
   {"title":"Progetto preliminare","description":"Concept, prime planimetrie, presentazione cliente.","default_amount_pct":20},
   {"title":"Progetto definitivo","description":"Tavole esecutive, computo metrico, capitolato.","default_amount_pct":30},
   {"title":"Progetto esecutivo","description":"Dettagli costruttivi, particolari, specifiche tecniche.","default_amount_pct":20},
   {"title":"Direzione lavori","description":"Coordinamento cantiere, SAL, contabilità lavori.","default_amount_pct":20}
 ]$json$::jsonb,
 8000.00,
 true),

('architect',
 'Pratica edilizia (CILA/SCIA)',
 'Predisposizione e gestione pratica edilizia presso il Comune.',
 $json$[
   {"title":"Raccolta documentazione","description":"Visure, planimetrie catastali, titolo abilitativo precedente.","default_amount_pct":25},
   {"title":"Redazione pratica","description":"Compilazione modulistica, relazione tecnica, allegati.","default_amount_pct":40},
   {"title":"Deposito e integrazioni","description":"Invio sportello unico, gestione richieste integrazione.","default_amount_pct":25},
   {"title":"Chiusura pratica","description":"Comunicazione fine lavori, agibilità.","default_amount_pct":10}
 ]$json$::jsonb,
 3000.00,
 true),

('architect',
 'Direzione lavori cantiere',
 'Direzione tecnica e contabilità lavori per cantieri di media dimensione.',
 $json$[
   {"title":"Avvio cantiere","description":"Verifiche preliminari, coordinamento imprese, cronoprogramma.","default_amount_pct":15},
   {"title":"SAL 1 (30%)","description":"Stato avanzamento lavori al raggiungimento del primo terzo.","default_amount_pct":25},
   {"title":"SAL 2 (70%)","description":"Stato avanzamento intermedio, verifica scostamenti.","default_amount_pct":30},
   {"title":"Collaudo finale","description":"Verifiche, certificazioni, consegna.","default_amount_pct":30}
 ]$json$::jsonb,
 6000.00,
 true),

-- ============================== PHOTOGRAPHER =================================
('photographer',
 'Wedding completo',
 'Servizio fotografico matrimoniale: pre-wedding, cerimonia, ricevimento, gallery.',
 $json$[
   {"title":"Caparra confirmatoria","description":"Acconto del 30% alla firma del contratto.","default_amount_pct":30},
   {"title":"Pre-wedding shooting","description":"Shooting di coppia 1-2 settimane prima del matrimonio.","default_amount_pct":15},
   {"title":"Cerimonia e ricevimento","description":"Copertura completa giornata matrimonio.","default_amount_pct":30},
   {"title":"Selezione e post-produzione","description":"Selezione scatti, editing, color grading.","default_amount_pct":15},
   {"title":"Consegna gallery online","description":"Upload gallery, link condivisibile, copia archivio.","default_amount_pct":10}
 ]$json$::jsonb,
 2500.00,
 true),

('photographer',
 'Servizio brand',
 'Shooting per uso commerciale: ritratti staff, ambient, prodotti chiave.',
 $json$[
   {"title":"Brief e mood board","description":"Definizione stile, riferimenti, shot list.","default_amount_pct":20},
   {"title":"Shooting","description":"Sessione di shooting in loco o studio.","default_amount_pct":40},
   {"title":"Selezione e editing","description":"Selezione, color correction, retouch.","default_amount_pct":25},
   {"title":"Consegna file","description":"Consegna in alta risoluzione + versioni web.","default_amount_pct":15}
 ]$json$::jsonb,
 1500.00,
 true),

('photographer',
 'Shooting prodotto e-commerce',
 'Catalogo fotografico prodotti per e-commerce: still life, ambient, dettagli.',
 $json$[
   {"title":"Brief e setup","description":"Pianificazione scatti, setup luci, preparazione fondali.","default_amount_pct":25},
   {"title":"Sessione di scatto","description":"Shooting prodotti in studio, varianti angolazione.","default_amount_pct":40},
   {"title":"Post-produzione","description":"Scontornamento, color, ritocco professionale.","default_amount_pct":25},
   {"title":"Consegna ottimizzata","description":"Export multi-formato (web, print, marketplace).","default_amount_pct":10}
 ]$json$::jsonb,
 800.00,
 true),

-- ============================== ACCOUNTANT ===================================
('accountant',
 'Contabilità ordinaria mensile',
 'Tenuta contabilità mensile per impresa: registrazioni, IVA, F24, consulenza ricorrente.',
 '[]'::jsonb,
 200.00,
 true),

('accountant',
 'Dichiarazione redditi forfettario',
 'Compilazione e invio dichiarazione redditi annuale per regime forfettario.',
 $json$[
   {"title":"Raccolta documenti","description":"Acquisizione fatture emesse, ricevute, certificazioni.","default_amount_pct":30},
   {"title":"Calcolo imposte","description":"Calcolo coefficiente redditività, imposta sostitutiva, INPS.","default_amount_pct":35},
   {"title":"Invio telematico","description":"Trasmissione modello redditi all'Agenzia delle Entrate.","default_amount_pct":20},
   {"title":"Pagamento F24","description":"Predisposizione F24 saldo + acconti, comunicazione scadenze.","default_amount_pct":15}
 ]$json$::jsonb,
 300.00,
 true),

('accountant',
 'Apertura partita IVA',
 'Pratica completa apertura P.IVA: AA9/12, codice ATECO, INPS, INAIL, gestionale.',
 $json$[
   {"title":"Consulenza preliminare","description":"Analisi attività, scelta regime fiscale, codice ATECO.","default_amount_pct":25},
   {"title":"Apertura Agenzia Entrate","description":"Compilazione e invio AA9/12 telematico.","default_amount_pct":30},
   {"title":"Iscrizione INPS/INAIL","description":"Iscrizione gestione separata o cassa professionale.","default_amount_pct":25},
   {"title":"Setup operativo","description":"Configurazione gestionale fatture, formazione adempimenti.","default_amount_pct":20}
 ]$json$::jsonb,
 350.00,
 true),

-- ============================== SMM ==========================================
('smm',
 'Gestione social mensile',
 'Piano editoriale, content creation, community management per un brand su 2 canali.',
 '[]'::jsonb,
 700.00,
 true),

('smm',
 'Campagna ads spot',
 'Pianificazione, lancio e ottimizzazione campagna pubblicitaria singola Meta o Google Ads.',
 $json$[
   {"title":"Brief e obiettivi","description":"KPI, target audience, budget, creatività disponibili.","default_amount_pct":15},
   {"title":"Strategia e setup","description":"Struttura campagna, pubblici, copy, A/B test.","default_amount_pct":30},
   {"title":"Ottimizzazione attiva","description":"Monitoraggio quotidiano, tweak budget, scaling.","default_amount_pct":35},
   {"title":"Report finale","description":"Analisi performance, learnings, raccomandazioni.","default_amount_pct":20}
 ]$json$::jsonb,
 1200.00,
 true),

('smm',
 'Lancio prodotto 30 giorni',
 'Lancio prodotto multi-canale in 30 giorni: teaser, lancio, post-lancio.',
 $json$[
   {"title":"Strategia di lancio","description":"Piano editoriale, calendario, KPI, definizione waiting list.","default_amount_pct":20},
   {"title":"Pre-lancio (teaser)","description":"Contenuti teaser, costruzione attesa, raccolta lead.","default_amount_pct":25},
   {"title":"Lancio (settimana hot)","description":"Live event, ads, attivazione partner, push contenuti.","default_amount_pct":35},
   {"title":"Post-lancio e report","description":"Re-engagement, content evergreen, report KPI vs target.","default_amount_pct":20}
 ]$json$::jsonb,
 2500.00,
 true);
