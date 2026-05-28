import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scholarshipApi } from '../../api/scholarship.api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import type { Scholarship } from '../../types';

const emptyForm = {
  name: '', description: '', totalBudget: 0, perAwardAmount: 0, maxAwardees: 10,
  eligibilityCriteria: { minCgpa: 0, maxFamilyIncome: 0 },
  requiredDocuments: ['marksheet', 'income_certificate', 'id_proof'],
  applicationDeadline: '', academicYear: '2025-26',
};

export default function ManageScholarships() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [docsInput, setDocsInput] = useState('marksheet, income_certificate, id_proof');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-scholarships'],
    queryFn: () => scholarshipApi.getAll({ isActive: true, limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: scholarshipApi.create,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-scholarships'] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Scholarship> }) => scholarshipApi.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-scholarships'] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: scholarshipApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-scholarships'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setDocsInput('marksheet, income_certificate, id_proof');
  };

  const startEdit = (s: Scholarship) => {
    setEditingId(s.id);
    setForm({
      name: s.name, description: s.description, totalBudget: s.totalBudget,
      perAwardAmount: s.perAwardAmount, maxAwardees: s.maxAwardees,
      eligibilityCriteria: s.eligibilityCriteria as typeof emptyForm.eligibilityCriteria,
      requiredDocuments: s.requiredDocuments,
      applicationDeadline: s.applicationDeadline.split('T')[0],
      academicYear: s.academicYear,
    });
    setDocsInput(s.requiredDocuments.join(', '));
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      requiredDocuments: docsInput.split(',').map((d) => d.trim()).filter(Boolean),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Scholarships</h1>
          <p className="text-muted-foreground">{data?.total || 0} active scholarship(s)</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Scholarship
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Edit Scholarship' : 'New Scholarship'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Total Budget (₹)</Label>
                  <Input type="number" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: +e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Per Award (₹)</Label>
                  <Input type="number" value={form.perAwardAmount} onChange={(e) => setForm({ ...form, perAwardAmount: +e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Max Awardees</Label>
                  <Input type="number" value={form.maxAwardees} onChange={(e) => setForm({ ...form, maxAwardees: +e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min CGPA</Label>
                  <Input type="number" step="0.1" value={form.eligibilityCriteria.minCgpa} onChange={(e) => setForm({ ...form, eligibilityCriteria: { ...form.eligibilityCriteria, minCgpa: +e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label>Max Family Income (₹)</Label>
                  <Input type="number" value={form.eligibilityCriteria.maxFamilyIncome} onChange={(e) => setForm({ ...form, eligibilityCriteria: { ...form.eligibilityCriteria, maxFamilyIncome: +e.target.value } })} />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Required Documents (comma-separated)</Label>
                <Input value={docsInput} onChange={(e) => setDocsInput(e.target.value)} placeholder="marksheet, income_certificate, id_proof" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Scholarship List */}
      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {data?.scholarships?.map((s: Scholarship) => (
            <Card key={s.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{s.description}</p>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Budget: ₹{s.totalBudget.toLocaleString('en-IN')}</span>
                      <span>Award: ₹{s.perAwardAmount.toLocaleString('en-IN')}</span>
                      <span>Max: {s.maxAwardees}</span>
                      <span>Apps: {s._count?.applications || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { if (confirm('Deactivate this scholarship?')) deleteMutation.mutate(s.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
