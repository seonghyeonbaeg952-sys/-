import { createServer } from 'vite'

// Exercise the real provider and enquiry form. Only publication transport is
// controlled; the fixture has no Supabase configuration and cannot submit data.
export async function createPublicationFixtureServer() {
  const fixture = `import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { SiteEditorProvider } from '/src/components/site-editor/SiteEditorProvider.tsx';
import { SampleLanguageContext } from '/src/features/sample-language/useSampleLanguage.ts';
import { ContactInquiryForm } from '/src/components/contact/ContactInquiryForm.tsx';
import { finishEnglish } from '/__publication_transport.ts';
function Fixture() {
  const [language, setLanguage] = useState('ko');
  const [englishReady, setEnglishReady] = useState(false);
  const sample = { enabled: true, isSample: true, language, setLanguage,
    translate: value => value, translateData: value => value,
    translateHome: value => value, href: value => value, contentLoading: language === 'en' && !englishReady };
  return <MemoryRouter initialEntries={['/contact?lang=ko']}>
    <button onClick={() => setLanguage('en')}>English fixture</button>
    <button onClick={() => setLanguage('ko')}>Korean fixture</button>
    <button onClick={() => { finishEnglish(); setEnglishReady(true); }}>Finish English publication</button>
    <SampleLanguageContext value={sample}><SiteEditorProvider>
      <ContactInquiryForm initialType="general" />
    </SiteEditorProvider></SampleLanguageContext>
  </MemoryRouter>;
}
createRoot(document.getElementById('root')).render(<Fixture />);`
  const transport = `let finish;
const english = new Promise(resolve => { finish = resolve; });
export const loadPublicEditorPages = async () => ({ data: [], error: null });
export const loadPublicSampleEnglishEditorPages = () => english;
export const invalidateEditorCache = () => {};
export const invalidateSampleEnglishEditorCache = () => {};
export const finishEnglish = () => finish({ data: [], error: null });`
  const server = await createServer({
    configFile: false, appType: 'custom', envDir: false, logLevel: 'silent',
    server: { host: '127.0.0.1', port: 0 },
    plugins: [{ name: 'publication-continuity-fixture', enforce: 'pre',
      resolveId(id, importer) {
        if (id.startsWith('/__publication_')) return id
        if (id === '../../lib/siteEditorApi' && importer?.endsWith('/SiteEditorProvider.tsx')) return '/__publication_transport.ts'
      },
      load(id) {
        if (id === '/__publication_fixture.tsx') return fixture
        if (id === '/__publication_transport.ts') return transport
      },
      configureServer(vite) {
        vite.middlewares.use((req, res, next) => {
          if (req.url !== '/__publication-test') return next()
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end('<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Publication continuity test</title></head><body><div id="root"></div><script type="module" src="/__publication_fixture.tsx"></script></body></html>')
        })
      },
    }],
  })
  await server.listen()
  return server
}
