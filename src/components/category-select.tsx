import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from './ui/label';
import { useCategories } from '@/context';
import { useRouter } from 'next/navigation';

interface CategorySelectProps {
  label?: string;
}

export function CategorySelect({ label }: CategorySelectProps) {
  const router = useRouter();
  const { categories, selectedCategoryId, setSelectedCategoryId } = useCategories();

  const handleCategoryChange = (value: string) => {
    setSelectedCategoryId(value);
    router.push(`/category?id=${value}`);
  };

  return <div className="flex flex-col gap-1">
    {label && <Label className="font-bold text-sm">{label}</Label>}

    <Select value={selectedCategoryId || ''} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Categorias" />
      </SelectTrigger>

      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category._id} value={category._id}>{category.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>;
}
