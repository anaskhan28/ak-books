import { Loader2 } from "lucide-react";

export default function EditQuotationLoading() {
  return (
    <div className="flex pt-40 justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
    </div>
  );
}
