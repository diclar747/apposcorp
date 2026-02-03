import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Filter, MoreHorizontal, Store, MapPin, Phone, Star, CheckCircle, XCircle } from 'lucide-react';
import { mockStores, mockUsers } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminStores() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredStores = mockStores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && store.isActive) ||
                         (filterStatus === 'inactive' && !store.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tiendas</h1>
          <p className="text-gray-500">Gestiona las tiendas del marketplace</p>
        </div>
        <Button className="bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Tienda
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar tiendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                Todas
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                size="sm"
              >
                Activas
              </Button>
              <Button
                variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('inactive')}
                size="sm"
              >
                Inactivas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.map((store, index) => {
          const seller = mockUsers.find(u => u.id === store.sellerId);
          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Banner */}
                <div className="h-32 bg-gray-200 relative">
                  {store.banner ? (
                    <img src={store.banner} alt={store.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                  <div className="absolute top-3 right-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="bg-white/80 hover:bg-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver detalles</DropdownMenuItem>
                        <DropdownMenuItem>Editar tienda</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Desactivar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Logo and Name */}
                  <div className="flex items-start gap-3 -mt-8 mb-3">
                    <div className="w-16 h-16 rounded-xl bg-white shadow-md p-1">
                      {store.logo ? (
                        <img src={store.logo} alt={store.name} className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                          <Store className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="pt-8">
                      <h3 className="font-semibold text-gray-900">{store.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>4.8</span>
                        <span>({store.products.length} productos)</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{store.description}</p>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{store.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{store.phone}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <img
                        src={seller?.avatar}
                        alt={seller?.firstName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm text-gray-600">{seller?.firstName} {seller?.lastName}</span>
                    </div>
                    <Badge variant={store.isActive ? 'default' : 'secondary'}>
                      {store.isActive ? (
                        <><CheckCircle className="w-3 h-3 mr-1" /> Activa</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inactiva</>
                      )}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filteredStores.length === 0 && (
        <div className="text-center py-12">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No se encontraron tiendas</h3>
          <p className="text-gray-500">Intenta con otros filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
}
