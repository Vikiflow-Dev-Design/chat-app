import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Product } from "@/types/product";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Tag, DollarSign, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ViewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
}

export function ViewProductDialog({
  open,
  onOpenChange,
  product,
}: ViewProductDialogProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Product Details
          </DialogTitle>
          <DialogDescription>
            View detailed information about this product.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            {product.imageUrl && (
              <div className="mt-2 mb-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="rounded-md w-full max-h-48 object-cover"
                />
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                <Info className="h-4 w-4 mr-1" /> Description
              </h4>
              <p className="text-sm">{product.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" /> Price
                </h4>
                <p className="text-sm font-medium">${product.price.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <Tag className="h-4 w-4 mr-1" /> Category
                </h4>
                <p className="text-sm">{product.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">
                  Stock Status
                </h4>
                <Badge
                  variant={product.inStock ? "default" : "destructive"}
                  className="mt-1"
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
              {product.createdAt && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Added
                  </h4>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(product.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
