/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { CapabilitiesBento } from './components/CapabilitiesBento';
import { ProjectsShowcase } from './components/ProjectsShowcase';
import { Methodology } from './components/Methodology';
import { LeadCapture } from './components/LeadCapture';
import { Footer } from './components/Footer';

export default function App() {
  const [prefillNote, setPrefillNote] = useState<string>('');

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleConsultationRequest = (context?: string) => {
    if (context) {
      setPrefillNote(context);
    }
    scrollToSection('contact');
  };

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#4A0819] text-white">
      <Navbar onNavigate={scrollToSection} />
      <main className="flex-1">
        <Hero
          onPrimaryCta={() => scrollToSection('contact')}
          onSecondaryCta={() => scrollToSection('projects')}
        />
        <CapabilitiesBento />
        <ProjectsShowcase onRequestConsultation={handleConsultationRequest} />
        <Methodology />
        <LeadCapture prefillNote={prefillNote} />
      </main>
      <Footer onNavigate={scrollToSection} />
    </div>
  );
}
