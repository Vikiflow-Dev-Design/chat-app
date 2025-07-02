import { useState } from "react";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { useToast } from "@/components/ui/use-toast";
import { EditProductDialog } from "@/components/EditProductDialog";
import { ViewProductDialog } from "@/components/ViewProductDialog";
import type { Product } from "@/types/product";
import { ProductsSkeleton } from "@/components/skeletons/ProductsSkeleton";

interface ProductListProps {
  chatbotId: string;
}

export function ProductList({ chatbotId }: ProductListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Fetch products
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", chatbotId],
    queryFn: async () => {
      const data = await productService.getProducts(chatbotId);
      // Transform MongoDB _id to id for frontend
      return data.map((product) => ({
        ...product,
        id: product._id || product.id,
      }));
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products", chatbotId] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const handleView = async (productId: string) => {
    try {
      const product = await productService.getProduct(productId);
      // Transform MongoDB _id to id for frontend
      const transformedProduct = {
        ...product,
        id: product._id || product.id,
      };

      setSelectedProduct(transformedProduct);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Error viewing product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (productId: string) => {
    try {
      const product = await productService.getProduct(productId);
      // Transform MongoDB _id to id for frontend
      const transformedProduct = {
        ...product,
        id: product._id || product.id,
      };

      setSelectedProduct(transformedProduct);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error editing product:", error);
      toast({
        title: "Error",
        description: "Failed to load product details for editing",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete) {
      try {
        await deleteMutation.mutateAsync(productToDelete);
      } catch (error) {
        // Error is handled in the mutation callbacks
      }
    }
  };

  if (isLoading) {
    return <ProductsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-destructive">
        Failed to load products. Please try again.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product: Product) => (
            <TableRow key={product.id}>
              <TableCell className="max-w-[200px]">
                <div className="truncate" title={product.name}>
                  {product.name}
                </div>
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.inStock
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {product.inStock ? "In Stock" : "Out of Stock"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleView(product.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(product.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteClick(product.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                No products found. Add your first product to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* View Dialog */}
      <ViewProductDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        product={selectedProduct}
      />

      {/* Edit Dialog */}
      {selectedProduct && (
        <EditProductDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          product={selectedProduct}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              product from your chatbot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
