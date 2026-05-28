import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { scholarshipApi } from '../../api/scholarship.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Search, Calendar, DollarSign, Users, GraduationCap } from 'lucide-react';
import type { Scholarship } from '../../types';

export default function ScholarshipList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['scholarships', { search, page, limit: 12 }],
    queryFn: () => scholarshipApi.getAll({ search, page, limit: 12 }),
  });

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Available Scholarships</h1>
        <p className="text-muted-foreground">Find and apply for scholarships that match your profile</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search scholarships..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-5 bg-slate-200 rounded w-3/4" /></CardHeader>
              <CardContent><div className="space-y-2"><div className="h-4 bg-slate-200 rounded" /><div className="h-4 bg-slate-200 rounded w-1/2" /></div></CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.scholarships?.map((scholarship: Scholarship) => {
              const deadline = new Date(scholarship.applicationDeadline);
              const isExpired = deadline < new Date();

              return (
                <Card key={scholarship.id} className="hover:shadow-lg transition-all duration-200 group flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                          {scholarship.name}
                        </CardTitle>
                        <CardDescription className="mt-1">{scholarship.academicYear}</CardDescription>
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {scholarship.description}
                    </p>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold">₹{scholarship.perAwardAmount.toLocaleString('en-IN')}</span>
                        <span className="text-muted-foreground">per award</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Max {scholarship.maxAwardees} awardees</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className={isExpired ? 'text-red-500' : ''}>
                          {isExpired ? 'Expired' : `Deadline: ${deadline.toLocaleDateString('en-IN')}`}
                        </span>
                      </div>
                    </div>

                    <Link to={`/student/apply/${scholarship.id}`} className="block">
                      <Button className="w-full" disabled={isExpired}>
                        {isExpired ? 'Closed' : 'Apply Now'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {data?.scholarships?.length === 0 && (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">No scholarships found</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {data.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}>
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
