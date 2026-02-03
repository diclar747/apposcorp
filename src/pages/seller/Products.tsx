import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, Package, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAuthStore } from '@/stores';
import { mockProducts } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function SellerProducts() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'online' | 'local'>('all');
  
  const sellerProducts = mockProducts.filter(p => p.sellerId === user?.id);
  
  const filteredProducts = sellerProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVisibility = visibilityFilter === 'all' || product.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Productos</h1>
          <p className="text-gray-500">Gestiona tus productos y servicios</p>
        </div>
        <Button className="bg-green-600">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant={visibilityFilter === 'all' ? 'default' : 'outline'} onClick={() => setVisibilityFilter('all')} size="sm">Todos</Button>
              <Button variant={visibilityFilter === 'online' ? 'default' : 'outline'} onClick={() => setVisibilityFilter('online')} size="sm">En línea</Button>
              <Button variant={visibilityFilter === 'local' ? 'default' : 'outline'} onClick={() => setVisibilityFilter('local')} size="sm">Local</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Visibilidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatCurrency(product.price)}</p>
                        {product.comparePrice && (
                          <p className="text-sm text-gray-400 line-through">{formatCurrency(product.comparePrice)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${product.stock < 5 ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock} unidades
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.visibility === 'online' ? 'default' : 'secondary'}>
                        {product.visibility === 'online' ? 'En línea' : product.visibility === 'local' ? 'Local' : 'Ambos'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={product.status === 'active'} />
                        <span className="text-sm">{product.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Ver</DropdownMenuItem>
                          <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
