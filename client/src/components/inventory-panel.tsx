import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Backpack, Plus, Sword, Shield, Zap, Package } from "lucide-react";
import { useState } from "react";
import type { InventoryItem, InsertInventoryItem } from "@shared/schema";

interface InventoryPanelProps {
  inventory: InventoryItem[];
  characterId: string;
}

const itemIcons = {
  weapon: Sword,
  armor: Shield,
  potion: Zap,
  misc: Package,
};

export default function InventoryPanel({ inventory, characterId }: InventoryPanelProps) {
  const { toast } = useToast();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    itemName: '',
    itemType: 'misc',
    quantity: 1,
    description: '',
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: InsertInventoryItem) => {
      const response = await fetch(`/api/characters/${characterId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to add item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/game-state'] });
      setIsAddingItem(false);
      setNewItem({ itemName: '', itemType: 'misc', quantity: 1, description: '' });
      toast({
        title: "Item Added",
        description: `${newItem.itemName} has been added to your inventory.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to inventory.",
        variant: "destructive",
      });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.itemName.trim()) return;
    
    addItemMutation.mutate({
      ...newItem,
      characterId,
    });
  };

  return (
    <Card className="bg-fantasy-dark border-fantasy-bronze">
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel font-semibold text-fantasy-gold flex items-center justify-between">
          <span className="flex items-center">
            <Backpack className="mr-2" size={20} />
            Inventory
          </span>
          <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-fantasy-gold hover:bg-fantasy-bronze">
                <Plus size={16} />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-fantasy-slate border-fantasy-bronze">
              <DialogHeader>
                <DialogTitle className="text-fantasy-gold">Add Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Item Name
                  </label>
                  <Input
                    value={newItem.itemName}
                    onChange={(e) => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
                    className="bg-fantasy-dark border-fantasy-bronze text-gray-100"
                    placeholder="Enter item name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={newItem.itemType}
                    onChange={(e) => setNewItem(prev => ({ ...prev, itemType: e.target.value }))}
                    className="w-full bg-fantasy-dark border border-fantasy-bronze rounded p-2 text-gray-100"
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                    <option value="potion">Potion</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="bg-fantasy-dark border-fantasy-bronze text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <Input
                    value={newItem.description}
                    onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-fantasy-dark border-fantasy-bronze text-gray-100"
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingItem(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addItemMutation.isPending}
                    className="bg-fantasy-gold text-fantasy-dark hover:bg-opacity-80"
                  >
                    {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2">
          {inventory.map((item) => {
            const IconComponent = itemIcons[item.itemType as keyof typeof itemIcons] || Package;
            return (
              <div
                key={item.id}
                className="bg-gray-800 border border-gray-600 rounded p-2 text-center hover:bg-gray-700 cursor-pointer transition-colors"
                title={item.description || item.itemName}
              >
                <IconComponent className="text-fantasy-gold text-lg mb-1 mx-auto" size={20} />
                <div className="text-xs">{item.itemName}</div>
                {item.quantity > 1 && (
                  <div className="text-xs text-gray-400">x{item.quantity}</div>
                )}
              </div>
            );
          })}
          
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 8 - inventory.length) }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-gray-900 border border-gray-700 rounded p-2 border-dashed opacity-50 h-16"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
