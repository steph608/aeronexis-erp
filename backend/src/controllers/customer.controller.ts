import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
} from '../services/customer.service';
import { logAction } from '../services/audit.service';

const createSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nom requis'),
  country: z.string().min(1, 'Pays requis'),
  type: z.enum(['Grand Compte', 'Moyen', 'PME']),
  annualRevenue: z.coerce.number().min(0),
  firstContractDate: z.string().transform(str => new Date(str)),
  status: z.string().default('Actif'),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  type: z.enum(['Grand Compte', 'Moyen', 'PME']).optional(),
  annualRevenue: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
});

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({ success: true, data: await getAllCustomers() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCustomer = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({ success: true, data: await getCustomerById(req.params['id'] as string) });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export const createCustomerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const customer = await createCustomer(data);

    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'CREATE',
      module: 'customers',
      description: `Nouveau client ajouté — ${customer.name} (${customer.id}) — Pays: ${customer.country} — Type: ${customer.type} — CA annuel: ${customer.annualRevenue.toLocaleString('fr-FR')} €`,
      ipAddress: req.ip,
    });

    res.status(201).json({ success: true, message: 'Client créé avec succès', data: customer });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Données invalides', errors: error.errors });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCustomerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const data = updateSchema.parse(req.body);

    // Récupérer l'état avant modification pour détailler les changements
    const before = await getCustomerById(id);
    const customer = await updateCustomer(id, data);

    // Construire une description lisible des changements
    const changes: string[] = [];
    if (data.status && data.status !== before.status) {
      changes.push(`Statut : ${before.status} → ${data.status}`);
    }
    if (data.name && data.name !== before.name) {
      changes.push(`Nom : "${before.name}" → "${data.name}"`);
    }
    if (data.country && data.country !== before.country) {
      changes.push(`Pays : ${before.country} → ${data.country}`);
    }
    if (data.annualRevenue !== undefined && data.annualRevenue !== before.annualRevenue) {
      changes.push(`CA annuel : ${before.annualRevenue.toLocaleString('fr-FR')} € → ${data.annualRevenue.toLocaleString('fr-FR')} €`);
    }
    if (data.type && data.type !== before.type) {
      changes.push(`Type : ${before.type} → ${data.type}`);
    }

    const isStatusOnly = data.status && Object.keys(data).length === 1;
    const label = isStatusOnly
      ? `Changement de statut client — ${customer.name} (${id}) — ${changes.join(', ')}`
      : `Modification client — ${customer.name} (${id}) — ${changes.join(' | ') || 'aucun changement détecté'}`;

    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'UPDATE',
      module: 'customers',
      description: label,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: 'Client modifié avec succès', data: customer });
  } catch (error: any) {
    if (error.name === 'ZodError') return res.status(400).json({ success: false, message: 'Données invalides', errors: error.errors });
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCustomerHandler = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params['id'] as string;
    const before = await getCustomerById(id).catch(() => null);
    const result = await deleteCustomer(id);

    await logAction({
      userId: req.user!.id,
      userEmail: req.user!.email,
      action: 'DELETE',
      module: 'customers',
      description: `Suppression client — ${before?.name || id} (${id})`,
      ipAddress: req.ip,
    });

    res.status(200).json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStats = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({ success: true, data: await getCustomerStats() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
