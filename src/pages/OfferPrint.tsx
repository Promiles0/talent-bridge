import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Printer } from "lucide-react";

export default function OfferPrint() {
  const { id } = useParams();
  const { data: offer, isLoading } = useQuery({
    queryKey: ["offer-print", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("offers")
        .select("*, internships(title, companies(name, logo_url, website))")
        .eq("id", id!)
        .maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!offer) return <div className="p-8">Offer not found.</div>;

  const company = (offer as any).internships?.companies;
  const sig = (offer as any).signature_data;

  return (
    <div className="min-h-screen bg-background py-10 print:py-0">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex justify-end mb-6 print:hidden">
          <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print / Save PDF</Button>
        </div>
        <div className="bg-white text-black p-12 rounded-lg shadow-lg print:shadow-none print:p-0">
          <div className="flex items-center gap-4 border-b pb-6 mb-8">
            {company?.logo_url && <img src={company.logo_url} alt={company.name} className="h-14 w-14 rounded-lg object-cover" />}
            <div>
              <h1 className="text-2xl font-bold font-heading">{company?.name}</h1>
              {company?.website && <p className="text-sm text-gray-600">{company.website}</p>}
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Internship Offer</h2>
          <p className="text-sm text-gray-600 mb-6">Issued {format(new Date(offer.created_at), "MMMM d, yyyy")}</p>

          <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
            <div><p className="text-gray-500">Role</p><p className="font-medium">{(offer as any).internships?.title}</p></div>
            <div><p className="text-gray-500">Start</p><p className="font-medium">{format(new Date(offer.start_date), "MMM d, yyyy")}</p></div>
            <div><p className="text-gray-500">End</p><p className="font-medium">{format(new Date(offer.end_date), "MMM d, yyyy")}</p></div>
            {offer.stipend && <div className="col-span-3"><p className="text-gray-500">Stipend</p><p className="font-medium">{offer.stipend}</p></div>}
          </div>

          <h3 className="font-semibold mb-2">Terms</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed mb-12">{offer.terms}</p>

          <div className="grid grid-cols-2 gap-8 pt-8 border-t">
            <div>
              <p className="text-xs text-gray-500 mb-2">EMPLOYER</p>
              <p className="font-semibold">{company?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">CANDIDATE SIGNATURE</p>
              {sig?.name ? (
                <>
                  <p className="font-heading italic text-xl">{sig.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Signed {format(new Date(offer.signed_at), "MMM d, yyyy")}</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 italic">Awaiting signature</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
