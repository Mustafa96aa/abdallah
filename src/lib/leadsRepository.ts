import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface LeadInput {
  name: string;
  contact: string;
  company: string;
  scope: string;
  budget: string;
  notes: string;
}

/** يُرمى عندما لا يكون Supabase مضبوطاً، فلا يوجد مكان لحفظ الطلب. */
export class LeadsUnavailableError extends Error {
  constructor() {
    super('LEADS_UNAVAILABLE');
    this.name = 'LeadsUnavailableError';
  }
}

export async function submitLead(input: LeadInput): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    throw new LeadsUnavailableError();
  }

  const { error } = await supabase.from('leads').insert({
    name: input.name.trim(),
    contact: input.contact.trim(),
    company: input.company.trim() || null,
    scope: input.scope,
    budget: input.budget,
    notes: input.notes.trim() || null,
  });

  if (error) {
    throw new Error(
      'تعذر إرسال الطلب حالياً. يرجى المحاولة مرة أخرى أو مراسلتي مباشرة عبر البريد.'
    );
  }
}
