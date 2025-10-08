import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface PromotionFormProps {
  onSuccess?: () => void;
}

export function PromotionForm({ onSuccess }: PromotionFormProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [discountValue, setDiscountValue] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const createPromotionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/promotions", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Promotion created successfully",
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create promotion",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !discountType || !discountValue) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createPromotionMutation.mutate({
      title,
      description,
      discountType,
      discountValue,
      status: "active",
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  };

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-display font-semibold mb-6">Create New Promotion</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Promotion Title</Label>
          <Input
            id="title"
            placeholder="e.g., 50% Off Appetizers"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            data-testid="input-promotion-title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe your promotion..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            data-testid="input-promotion-description"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount-type">Discount Type</Label>
            <Select value={discountType} onValueChange={setDiscountType}>
              <SelectTrigger id="discount-type" data-testid="select-discount-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="bogo">BOGO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount-value">Discount Value</Label>
            <Input
              id="discount-value"
              placeholder="e.g., 50"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              data-testid="input-discount-value"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-start-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  data-testid="button-end-date"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button 
            type="submit" 
            className="flex-1" 
            data-testid="button-create-promotion"
            disabled={createPromotionMutation.isPending}
          >
            {createPromotionMutation.isPending ? "Creating..." : "Create Promotion"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            data-testid="button-cancel"
            onClick={() => onSuccess?.()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
