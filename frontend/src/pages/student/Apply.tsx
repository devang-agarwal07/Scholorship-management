import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { scholarshipApi } from '../../api/scholarship.api';
import { useCreateApplication, useUpdateApplication, useUploadDocument, useSubmitApplication } from '../../hooks/useApplications';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import DocumentUploader from '../../components/DocumentUploader';
import { cn } from '../../lib/utils';
import { CheckCircle, ChevronLeft, ChevronRight, Send } from 'lucide-react';

const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const academicSchema = z.object({
  institution: z.string().min(1, 'Required'),
  department: z.string().min(1, 'Required'),
  yearOfStudy: z.coerce.number().int().min(1).max(6),
  cgpa: z.coerce.number().min(0).max(10),
});

const financialSchema = z.object({
  familyIncome: z.coerce.number().positive('Must be positive'),
  incomeSource: z.string().optional(),
});

const statementSchema = z.object({
  personalStatement: z.string().min(50, 'At least 50 characters').max(5000, 'Max 5000 characters'),
});

const steps = [
  { label: 'Personal Info', schema: personalInfoSchema },
  { label: 'Academic', schema: academicSchema },
  { label: 'Financial', schema: financialSchema },
  { label: 'Statement', schema: statementSchema },
  { label: 'Documents', schema: null },
  { label: 'Review', schema: null },
];

export default function Apply() {
  const { scholarshipId } = useParams<{ scholarshipId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [currentStep, setCurrentStep] = useState(0);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, { fileName: string; status: string }>>({});

  const { data: scholarship } = useQuery({
    queryKey: ['scholarship', scholarshipId],
    queryFn: () => scholarshipApi.getById(scholarshipId!),
    enabled: !!scholarshipId,
  });

  const createMutation = useCreateApplication();
  const updateMutation = useUpdateApplication();
  const uploadMutation = useUploadDocument();
  const submitMutation = useSubmitApplication();

  // Pre-fill personal info from profile
  useEffect(() => {
    if (user?.profile) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        address: user.profile?.address || '',
        institution: user.profile?.institution || '',
        department: user.profile?.department || '',
        yearOfStudy: user.profile?.yearOfStudy || 1,
        cgpa: user.profile?.cgpa || 0,
      }));
    }
  }, [user]);

  const currentSchema = steps[currentStep].schema;

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: currentSchema ? zodResolver(currentSchema) : undefined,
    defaultValues: formData as Record<string, string | number>,
  });

  // Sync form values when step changes
  useEffect(() => {
    Object.entries(formData).forEach(([key, value]) => {
      setValue(key, value as string | number);
    });
  }, [currentStep, formData, setValue]);

  const onStepSubmit = async (data: Record<string, unknown>) => {
    const mergedData = { ...formData, ...data };
    setFormData(mergedData);

    // Create application on first step if not created
    if (!applicationId && scholarshipId) {
      try {
        const app = await createMutation.mutateAsync({
          scholarshipId,
          personalStatement: mergedData.personalStatement as string,
          familyIncome: mergedData.familyIncome as number,
          academicDetails: {
            institution: mergedData.institution,
            department: mergedData.department,
            yearOfStudy: mergedData.yearOfStudy,
            cgpa: mergedData.cgpa,
          },
        });
        setApplicationId(app.id);
      } catch {
        return;
      }
    } else if (applicationId) {
      // Auto-save draft
      try {
        await updateMutation.mutateAsync({
          id: applicationId,
          data: {
            personalStatement: mergedData.personalStatement as string,
            familyIncome: mergedData.familyIncome as number,
            academicDetails: {
              institution: mergedData.institution,
              department: mergedData.department,
              yearOfStudy: mergedData.yearOfStudy,
              cgpa: mergedData.cgpa,
            },
          },
        });
      } catch {
        // continue
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleDocUpload = async (file: File, documentType: string) => {
    if (!applicationId) return;
    await uploadMutation.mutateAsync({ file, applicationId, documentType });
    setUploadedDocs((prev) => ({
      ...prev,
      [documentType]: { fileName: file.name, status: 'PENDING' },
    }));
  };

  const handleFinalSubmit = async () => {
    if (!applicationId) return;
    try {
      await submitMutation.mutateAsync(applicationId);
      navigate('/student/my-applications');
    } catch {
      // error handled by mutation
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const allValues = watch();

  return (
    <div className="max-w-3xl mx-auto space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Apply for Scholarship</h1>
        <p className="text-muted-foreground">{scholarship?.name || 'Loading...'}</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all flex-shrink-0',
              idx < currentStep ? 'bg-emerald-500 text-white' :
              idx === currentStep ? 'bg-primary text-primary-foreground shadow-lg' :
              'bg-slate-200 text-slate-500'
            )}>
              {idx < currentStep ? <CheckCircle className="w-4 h-4" /> : idx + 1}
            </div>
            {idx < steps.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1', idx < currentStep ? 'bg-emerald-500' : 'bg-slate-200')} />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm font-medium text-primary">{steps[currentStep].label}</p>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Step {currentStep + 1}: {steps[currentStep].label}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 0: Personal Info */}
          {currentStep === 0 && (
            <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input {...register('firstName')} defaultValue={formData.firstName as string} />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input {...register('lastName')} defaultValue={formData.lastName as string} />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message as string}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...register('phone')} defaultValue={formData.phone as string} />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea {...register('address')} defaultValue={formData.address as string} />
              </div>
              <div className="flex justify-end">
                <Button type="submit">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </form>
          )}

          {/* Step 1: Academic */}
          {currentStep === 1 && (
            <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input {...register('institution')} defaultValue={formData.institution as string} />
                {errors.institution && <p className="text-xs text-red-500">{errors.institution.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input {...register('department')} defaultValue={formData.department as string} />
                {errors.department && <p className="text-xs text-red-500">{errors.department.message as string}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year of Study</Label>
                  <Input type="number" {...register('yearOfStudy')} defaultValue={formData.yearOfStudy as number} />
                  {errors.yearOfStudy && <p className="text-xs text-red-500">{errors.yearOfStudy.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label>CGPA</Label>
                  <Input type="number" step="0.01" {...register('cgpa')} defaultValue={formData.cgpa as number} />
                  {errors.cgpa && <p className="text-xs text-red-500">{errors.cgpa.message as string}</p>}
                </div>
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={goBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button type="submit">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </form>
          )}

          {/* Step 2: Financial */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Annual Family Income (₹)</Label>
                <Input type="number" {...register('familyIncome')} defaultValue={formData.familyIncome as number} />
                {errors.familyIncome && <p className="text-xs text-red-500">{errors.familyIncome.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label>Primary Income Source</Label>
                <Input {...register('incomeSource')} defaultValue={formData.incomeSource as string} placeholder="e.g., Agriculture, Salaried, Business" />
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={goBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button type="submit">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </form>
          )}

          {/* Step 3: Personal Statement */}
          {currentStep === 3 && (
            <form onSubmit={handleSubmit(onStepSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Personal Statement</Label>
                <Textarea
                  rows={8}
                  {...register('personalStatement')}
                  defaultValue={formData.personalStatement as string}
                  placeholder="Tell us about yourself, your achievements, and why you deserve this scholarship..."
                />
                <p className="text-xs text-muted-foreground text-right">
                  {(allValues.personalStatement as string)?.length || 0}/5000 characters
                </p>
                {errors.personalStatement && <p className="text-xs text-red-500">{errors.personalStatement.message as string}</p>}
              </div>
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={goBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button type="submit">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </form>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {scholarship?.requiredDocuments?.map((docType) => (
                <DocumentUploader
                  key={docType}
                  documentType={docType}
                  label={docType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  onUpload={handleDocUpload}
                  existingFile={uploadedDocs[docType]}
                />
              ))}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={goBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={() => setCurrentStep(5)}>Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="font-medium mb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {formData.firstName as string} {formData.lastName as string}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {formData.phone as string || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="font-medium mb-2">Academic Details</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p><span className="text-muted-foreground">Institution:</span> {formData.institution as string}</p>
                    <p><span className="text-muted-foreground">Dept:</span> {formData.department as string}</p>
                    <p><span className="text-muted-foreground">Year:</span> {formData.yearOfStudy as number}</p>
                    <p><span className="text-muted-foreground">CGPA:</span> {formData.cgpa as number}</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="font-medium mb-2">Financial</h4>
                  <p className="text-sm"><span className="text-muted-foreground">Family Income:</span> ₹{(formData.familyIncome as number)?.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <h4 className="font-medium mb-2">Documents</h4>
                  <p className="text-sm">{Object.keys(uploadedDocs).length} document(s) uploaded</p>
                </div>
              </div>

              {submitMutation.isError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                  {(submitMutation.error as Error & { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submission failed.'}
                </div>
              )}

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={goBack}><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                <Button onClick={handleFinalSubmit} disabled={submitMutation.isPending} className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                  {submitMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-4 h-4 mr-2" /> Submit Application</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
