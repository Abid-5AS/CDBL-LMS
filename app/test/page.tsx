import { Button } from "@/components/ui/button";

export default function TestPage() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="bg-white p-6 rounded-xl border">
        <p className="mb-4">shadcn is working 🎉</p>
        <div className="flex gap-2">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </div>
    </div>
  );
}
