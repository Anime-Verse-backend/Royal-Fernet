
'use client';
/**
 * @fileoverview Página del panel de control de administración.
 * Muestra una tabla con los productos existentes y otra con los administradores.
 * Permite realizar acciones como agregar, editar o eliminar productos, y añadir nuevos admins.
 * Implementa modales para la gestión de productos y diálogos de confirmación.
 * Incluye un generador de facturas y un panel para enviar notificaciones.
 */
import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProducts, fetchAdmins, fetchStoreSettings, fetchDbTables, fetchTableContent, fetchStores } from "@/lib/data";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, Edit, Trash2, Search, FileText, Settings, XCircle, Github, Instagram, Facebook, Database, Store } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { Product, Admin, StoreSettings, HeroSlide, StoreLocation } from "@/lib/definitions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addProduct, updateProduct, deleteProduct, addAdmin, sendNotificationAction, updateStoreSettings, deleteAdmin } from "@/lib/actions";
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { formatCurrency, getSafeImageUrl } from '@/lib/utils';
import { Switch } from "@/components/ui/switch";
import { Separator } from '@/components/ui/separator';

// Main page component
export default function AdminDashboardPage() {
    return <DashboardContent />;
}

function DashboardContent() {
    const [products, setProducts] = useState<Product[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [productCurrentPage, setProductCurrentPage] = useState(1);
    
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productQuery = searchParams.get('q') || '';
    const adminQuery = searchParams.get('admin_q') || '';
    
    const refreshData = React.useCallback(async () => {
        try {
            const [productData, adminData, settingsData] = await Promise.all([
                fetchProducts(productQuery),
                fetchAdmins(adminQuery),
                fetchStoreSettings()
            ]);
            setProducts(productData);
            setAdmins(adminData);
            setStoreSettings(settingsData);
        } catch (error) {
             toast({
                title: "Error de Recarga",
                description: "No se pudieron recargar los datos del panel.",
                variant: 'destructive'
            });
        }
    }, [productQuery, adminQuery, toast]);

    useEffect(() => {
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, [refreshData]);
    
    const handleSearch = (term: string, type: 'product' | 'admin') => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set(type === 'product' ? 'q' : 'admin_q', term);
        } else {
            params.delete(type === 'product' ? 'q' : 'admin_q');
        }
        router.replace(`/admin/dashboard?${params.toString()}`);
    };

    if (loading) {
        return <div className="container mx-auto py-12 px-4 space-y-12"><Skeleton className="h-96 w-full" /></div>;
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold font-headline mb-8">Panel de Administración</h1>

            <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-1 h-auto md:h-10 md:grid-cols-7 mb-6">
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="products">Productos</TabsTrigger>
                    <TabsTrigger value="stores">Tiendas</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="settings">Configuración</TabsTrigger>
                    <TabsTrigger value="database">Base de Datos</TabsTrigger>
                    <TabsTrigger value="developers">Desarrolladores</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <OverviewTab products={products} settings={storeSettings} onSettingsChange={refreshData} />
                </TabsContent>
                <TabsContent value="products">
                   <ProductsTab products={products} currentPage={productCurrentPage} setCurrentPage={setProductCurrentPage} onSearch={handleSearch} query={productQuery} />
                </TabsContent>
                <TabsContent value="stores">
                    <StoresTab />
                </TabsContent>
                <TabsContent value="admins">
                   <AdminsTab admins={admins} onSearch={handleSearch} query={adminQuery}/>
                </TabsContent>
                <TabsContent value="settings">
                    <SettingsTab settings={storeSettings} onUpdate={refreshData} />
                </TabsContent>
                <TabsContent value="database">
                    <DatabaseViewer />
                </TabsContent>
                <TabsContent value="developers">
                    <DevelopersTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

const WhatsappIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 32 32" fill="currentColor" {...props}>
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 01-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 01-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.52-1.29.372-.775.372-1.457.234-1.828-.156-.389-.42-.516-.6-.516h-.114zM16 2.098a13.91 13.91 0 00-13.908 13.909c0 4.38 2.016 8.33 5.303 10.942l-1.6 5.844 5.973-1.566c1.63.888 3.444 1.374 5.292 1.374a13.91 13.91 0 100-27.817z" />
    </svg>
  );

// Form component for adding and editing products
function ProductForm({ product, onFormSubmit }: { product?: Product, onFormSubmit: () => void }) {
    const action = product ? updateProduct.bind(null, product.id) : addProduct;

    return (
        <form action={action} onSubmit={onFormSubmit} className="grid gap-4 py-4" encType="multipart/form-data">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" name="name" defaultValue={product?.name} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descripción</Label>
                <Textarea id="description" name="description" defaultValue={product?.description} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Categoría</Label>
                <Input id="category" name="category" defaultValue={product?.category} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Precio</Label>
                <Input id="price" name="price" type="number" step="0.01" defaultValue={product?.price} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discount" className="text-right">Descuento (%)</Label>
                <Input id="discount" name="discount" type="number" defaultValue={product?.discount} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Stock</Label>
                <Input id="stock" name="stock" type="number" defaultValue={product?.stock ?? 100} className="col-span-3" required />
            </div>
            
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor={`image${i}`} className="text-right">Imagen {i}</Label>
                    <div className="col-span-3">
                         <Tabs defaultValue={product?.images?.[i-1] && !product?.images?.[i-1].startsWith('data:') ? 'url' : 'upload'} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="url">URL</TabsTrigger>
                                <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                            </TabsList>
                            <TabsContent value="url">
                                <Input 
                                    name={`imageUrl${i}`} 
                                    placeholder="https://example.com/image.png" 
                                    defaultValue={product?.images?.[i-1] || ''} 
                                />
                            </TabsContent>
                            <TabsContent value="upload">
                                <Input name={`image${i}`} type="file" accept="image/*" />
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            ))}

            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isFeatured" className="text-right">Destacado</Label>
                <Checkbox id="isFeatured" name="isFeatured" defaultChecked={product?.is_featured} className="col-span-3 justify-self-start" />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">{product ? "Guardar Cambios" : "Añadir Producto"}</Button>
            </DialogFooter>
        </form>
    );
}

// Form component for adding admins
function AdminForm({ onFormSubmit }: { onFormSubmit: () => void }) {
    return (
        <form action={addAdmin} onSubmit={onFormSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nombre</Label>
                <Input id="name" name="name" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">Email</Label>
                <Input id="email" name="email" type="email" className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Contraseña</Label>
                <Input id="password" name="password" type="password" className="col-span-3" required />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Añadir Admin</Button>
            </DialogFooter>
        </form>
    );
}

function StoreSettingsForm({ settings, onUpdate }: { settings: StoreSettings | null; onUpdate: () => void; }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [heroSlides, setHeroSlides] = useState<(Partial<HeroSlide> & { file?: File | null, dataUrl?: string | null })[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        setHeroSlides(settings?.hero_images || []);
    }, [settings]);

    const handleFileChange = (index: number, file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const newSlides = [...heroSlides];
            newSlides[index] = { ...newSlides[index], dataUrl: e.target?.result as string, imageUrl: e.target?.result as string };
            setHeroSlides(newSlides);
        };
        reader.readAsDataURL(file);
    };

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);

        const form = event.currentTarget;
        const formData = new FormData(form);

        const slidesData = heroSlides.map((slide, index) => {
             const headline = formData.get(`heroHeadline_${index}`) as string;
             const subheadline = formData.get(`heroSubheadline_${index}`) as string;
             const buttonText = formData.get(`heroButtonText_${index}`) as string;
             // Use the stored dataUrl or the existing imageUrl
             const imageUrl = slide.dataUrl || slide.imageUrl;
             return { id: slide.id, headline, subheadline, buttonText, imageUrl };
        });

        const finalFormData = new FormData();
        finalFormData.append('heroImages', JSON.stringify(slidesData));

        // Append all other form fields
        for (const [key, value] of formData.entries()) {
            if (!key.startsWith('hero')) {
                 finalFormData.append(key, value);
            }
        }
        
        const result = await updateStoreSettings(finalFormData);

        if (result.success) {
            toast({ title: "Éxito", description: "La configuración se ha guardado." });
            onUpdate();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }

        setIsSubmitting(false);
    };
    
    const handleAddSlide = () => {
        setHeroSlides([...heroSlides, { id: `new_${Date.now()}`, headline: '', subheadline: '', buttonText: '', imageUrl: '' }]);
    };

    const handleRemoveSlide = (index: number) => {
        setHeroSlides(heroSlides.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Sección de Bienvenida (Carrusel Héroe)</CardTitle>
                    <CardDescription>Personaliza las diapositivas del carrusel principal.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {heroSlides.map((slide, index) => (
                        <div key={slide.id || index} className="space-y-4 p-4 border rounded-lg relative">
                            <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-destructive" onClick={() => handleRemoveSlide(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <h4 className="font-semibold">Diapositiva {index + 1}</h4>
                            <div className="grid gap-2">
                                <Label htmlFor={`heroHeadline_${index}`}>Título</Label>
                                <Input name={`heroHeadline_${index}`} defaultValue={slide.headline} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`heroSubheadline_${index}`}>Subtítulo</Label>
                                <Textarea name={`heroSubheadline_${index}`} defaultValue={slide.subheadline} required />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor={`heroButtonText_${index}`}>Texto del Botón</Label>
                                <Input name={`heroButtonText_${index}`} defaultValue={slide.buttonText} required />
                            </div>
                            <div className="grid gap-2">
                                <Label>Imagen de Fondo</Label>
                                <Input 
                                  name={`heroImageFile_${index}`} 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={(e) => handleFileChange(index, e.target.files?.[0] || null)}
                                />
                                {slide.imageUrl && <img src={slide.imageUrl} alt="preview" className="h-16 w-auto rounded-md object-cover mt-2" />}
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" onClick={handleAddSlide}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Slide
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sección de Colección Destacada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="featuredCollectionTitle">Título</Label>
                        <Input name="featuredCollectionTitle" defaultValue={settings?.featured_collection_title} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="featuredCollectionDescription">Descripción</Label>
                        <Textarea name="featuredCollectionDescription" defaultValue={settings?.featured_collection_description} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sección Promocional con Video</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="promoSectionTitle">Título</Label>
                        <Input name="promoSectionTitle" defaultValue={settings?.promo_section_title} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="promoSectionDescription">Descripción</Label>
                        <Textarea name="promoSectionDescription" defaultValue={settings?.promo_section_description} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="promoSectionVideoUrl">URL del Video de YouTube (Embed)</Label>
                        <Input name="promoSectionVideoUrl" defaultValue={settings?.promo_section_video_url} />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Información de Contacto y Redes Sociales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input name="phone" defaultValue={settings?.phone} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="contactEmail">Email</Label>
                        <Input name="contactEmail" type="email" defaultValue={settings?.contact_email} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="twitterUrl">URL de Twitter (X)</Label>
                        <Input name="twitterUrl" defaultValue={settings?.twitter_url} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="instagramUrl">URL de Instagram</Label>
                        <Input name="instagramUrl" defaultValue={settings?.instagram_url} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="facebookUrl">URL de Facebook</Label>
                        <Input name="facebookUrl" defaultValue={settings?.facebook_url} />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Notificaciones</CardTitle>
                    <CardDescription>Habilita o deshabilita las notificaciones emergentes en el sitio.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2">
                        <Switch
                          id="notificationsEnabled"
                          name="notificationsEnabled"
                          defaultChecked={settings?.notifications_enabled ?? true}
                        />
                        <Label htmlFor="notificationsEnabled">Habilitar Notificaciones</Label>
                      </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
        </form>
    );
}

function DatabaseViewer() {
    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [tableContent, setTableContent] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchDbTables().then(setTables);
    }, []);

    const handleTableSelect = async (tableName: string) => {
        if (!tableName) {
            setSelectedTable('');
            setTableContent([]);
            return;
        }
        setLoading(true);
        setSelectedTable(tableName);
        try {
            const content = await fetchTableContent(tableName);
            setTableContent(content);
        } catch (error) {
            toast({ title: "Error", description: "Could not load table content.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const headers = tableContent.length > 0 ? Object.keys(tableContent[0]) : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Visor de Base de Datos</CardTitle>
                <CardDescription>
                    Selecciona una tabla para ver su contenido. Esto es de solo lectura.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="max-w-xs">
                     <Select onValueChange={handleTableSelect} value={selectedTable}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona una tabla..." />
                        </SelectTrigger>
                        <SelectContent>
                            {tables.map(table => (
                                <SelectItem key={table} value={table}>{table}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
               
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ) : (
                    tableContent.length > 0 && (
                        <div className="rounded-lg border overflow-auto max-h-[600px]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-secondary">
                                    <TableRow>
                                        {headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tableContent.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {headers.map(header => (
                                                <TableCell key={`${rowIndex}-${header}`} className="max-w-xs truncate">
                                                    {String(row[header])}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )
                )}
            </CardContent>
        </Card>
    )
}

function OverviewTab({ products, settings, onSettingsChange }: { products: Product[], settings: StoreSettings | null, onSettingsChange: () => void }) {
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [invoiceItems, setInvoiceItems] = useState<{ product: Product; quantity: number }[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [selectedInvoiceProduct, setSelectedInvoiceProduct] = useState<string>('');
    const [selectedInvoiceQuantity, setSelectedInvoiceQuantity] = useState<number>(1);
    const [notificationsEnabled, setNotificationsEnabled] = useState(settings?.notifications_enabled ?? true);

    const notificationFormRef = useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleNotificationsToggle = async (enabled: boolean) => {
        setNotificationsEnabled(enabled);
        const formData = new FormData();
        // Append all existing settings to preserve them
        Object.entries(settings || {}).forEach(([key, value]) => {
            if (key !== 'notifications_enabled' && value !== null && value !== undefined) {
                const formKey = {
                    'hero_images': 'heroImages',
                    'featured_collection_title': 'featuredCollectionTitle',
                    'featured_collection_description': 'featuredCollectionDescription',
                    'promo_section_title': 'promoSectionTitle',
                    'promo_section_description': 'promoSectionDescription',
                    'promo_section_video_url': 'promoSectionVideoUrl',
                    'contact_email': 'contactEmail',
                    'twitter_url': 'twitterUrl',
                    'instagram_url': 'instagramUrl',
                    'facebook_url': 'facebookUrl'
                }[key] || key;
                formData.append(formKey, typeof value === 'object' ? JSON.stringify(value) : String(value));
            }
        });
        formData.append('notificationsEnabled', enabled ? 'on' : 'off');
        
        const result = await updateStoreSettings(formData);
        if (result.success) {
            toast({ title: "Éxito", description: `Notificaciones ${enabled ? 'habilitadas' : 'deshabilitadas'}.` });
            onSettingsChange();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
            setNotificationsEnabled(!enabled); // Revert on failure
        }
    };

    const handleAddInvoiceItem = () => {
        if (!selectedInvoiceProduct || selectedInvoiceQuantity < 1) {
            toast({ title: "Error", description: "Selecciona un producto y una cantidad válida.", variant: "destructive" });
            return;
        }

        const productToAdd = products.find(p => p.id === selectedInvoiceProduct);
        if (!productToAdd) return;
        
        if (invoiceItems.some(item => item.product.id === productToAdd.id)) {
            toast({ title: "Producto ya añadido", description: "Este producto ya está en la factura. Puedes cambiar la cantidad allí.", variant: "destructive" });
            return;
        }

        if (productToAdd.stock < selectedInvoiceQuantity) {
            toast({ title: "Stock insuficiente", description: `Solo hay ${productToAdd.stock} unidades de ${productToAdd.name} disponibles.`, variant: "destructive" });
            return;
        }
        
        setInvoiceItems([...invoiceItems, { product: productToAdd, quantity: selectedInvoiceQuantity }]);
        setSelectedInvoiceProduct('');
        setSelectedInvoiceQuantity(1);
    };

    const handleRemoveInvoiceItem = (productId: string) => {
        setInvoiceItems(invoiceItems.filter(item => item.product.id !== productId));
    };

    const handleInvoiceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (invoiceItems.length === 0) {
            toast({ title: "Error", description: "Añade al menos un producto a la factura.", variant: "destructive" });
            return;
        }
        if (!customerName.trim()) {
            toast({ title: "Error", description: "Por favor, introduce el nombre del cliente.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        const payload = {
            customerName,
            items: invoiceItems.map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
            })),
        };

        try {
            const response = await fetch('/api/generate-invoice-docx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo generar la factura.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `factura_${customerName.replace(/\s+/g, '_').toLowerCase()}.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast({ title: "Éxito", description: "La factura se ha descargado." });
            setInvoiceItems([]);
            setCustomerName('');
            onSettingsChange(); // Refresh data to reflect stock changes
        } catch (error: any) {
            toast({ title: "Error de Factura", description: error.message, variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleNotificationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSendingNotification(true);
        const formData = new FormData(event.currentTarget);
        const result = await sendNotificationAction(formData);

        if (result.success) {
            toast({ title: "Éxito", description: "Notificación enviada correctamente." });
            notificationFormRef.current?.reset();
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
        setIsSendingNotification(false);
    };
    
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                            <CardTitle className="text-sm font-medium">Notificaciones Globales</CardTitle>
                            <CardDescription className="text-xs pt-1">Anuncia ofertas, lanzamientos y más.</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                             <Switch
                                checked={notificationsEnabled}
                                onCheckedChange={handleNotificationsToggle}
                             />
                             <Label>{notificationsEnabled ? 'On' : 'Off'}</Label>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form ref={notificationFormRef} onSubmit={handleNotificationSubmit} className="flex flex-col gap-4 pt-4 border-t">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título</Label>
                            <Input id="title" name="title" placeholder="¡Nuevo Lanzamiento!" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">Mensaje</Label>
                            <Textarea id="message" name="message" placeholder="¡Anuncia una nueva oferta!" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image_url">URL de la Imagen (Opcional)</Label>
                            <Input id="image_url" name="image_url" placeholder="https://example.com/image.png" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="link_url">URL del Enlace (Opcional)</Label>
                            <Input id="link_url" name="link_url" placeholder="https://your-store.com/sale" />
                        </div>
                        <Button type="submit" disabled={isSendingNotification || !notificationsEnabled} className="w-full">
                            {isSendingNotification ? 'Enviando...' : 'Enviar Notificación'}
                        </Button>
                         {!notificationsEnabled && (
                            <p className="text-xs text-center text-muted-foreground">Las notificaciones están deshabilitadas.</p>
                        )}
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Generador de Facturas</CardTitle>
                    <CardDescription>Añade productos para generar y descargar una factura en formato .docx.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvoiceSubmit} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="customerName">Nombre del Cliente</Label>
                            <Input id="customerName" name="customerName" placeholder="John Doe" required value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                        </div>
                        
                        {invoiceItems.length > 0 && (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Producto</TableHead>
                                            <TableHead>Cant.</TableHead>
                                            <TableHead className="text-right">Acción</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoiceItems.map(item => (
                                            <TableRow key={item.product.id}>
                                                <TableCell>{item.product.name}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveInvoiceItem(item.product.id)}>
                                                        <XCircle className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <div className="flex-1 grid gap-2">
                                <Label htmlFor="product-select">Producto</Label>
                                <Select value={selectedInvoiceProduct} onValueChange={setSelectedInvoiceProduct}>
                                    <SelectTrigger id="product-select">
                                        <SelectValue placeholder="Selecciona un producto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.filter(p => p.stock > 0).map((product) => (
                                            <SelectItem key={product.id} value={product.id}>
                                                {product.name} (Stock: {product.stock})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2 w-24">
                                <Label htmlFor="quantity">Cantidad</Label>
                                <Input id="quantity" type="number" value={selectedInvoiceQuantity} onChange={(e) => setSelectedInvoiceQuantity(Number(e.target.value))} min="1" />
                            </div>
                            <Button type="button" onClick={handleAddInvoiceItem}>Añadir</Button>
                        </div>
                        
                        <Button type="submit" disabled={isGenerating || invoiceItems.length === 0} className="w-full">
                            {isGenerating ? 'Generando...' : 'Generar y Descargar Factura'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

function ProductsTab({ products, currentPage, setCurrentPage, onSearch, query }: { products: Product[], currentPage: number, setCurrentPage: (page: number) => void, onSearch: (term: string, type: 'product' | 'admin') => void, query: string }) {
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const productsPerPage = 10;
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalProductPages = Math.ceil(products.length / productsPerPage);

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Gestión de Productos</CardTitle>
                        <CardDescription>Añade, edita y elimina productos de tu tienda.</CardDescription>
                    </div>
                    <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Producto
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                                <DialogDescription>
                                    Rellena los detalles del nuevo producto. Haz clic en añadir cuando hayas terminado.
                                </DialogDescription>
                            </DialogHeader>
                            <ProductForm onFormSubmit={() => setIsProductDialogOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Buscar productos..." 
                        className="pl-8" 
                        defaultValue={query}
                        onChange={(e) => onSearch(e.target.value, 'product')}
                    />
                </div>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Imagen</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Destacado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentProducts.map((product) => {
                                const safeImageUrl = getSafeImageUrl(product.images?.[0]);

                                return (
                                    <TableRow key={product.id}>
                                        <TableCell>
                                            <Image 
                                                src={safeImageUrl}
                                                alt={product.name}
                                                width={40}
                                                height={40}
                                                className="rounded-md object-cover"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.category}</TableCell>
                                        <TableCell>{formatCurrency(product.price)}</TableCell>
                                        <TableCell>{product.stock}</TableCell>
                                        <TableCell>{product.is_featured ? 'Sí' : 'No'}</TableCell>
                                        <TableCell className="text-right">
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                        <span className="sr-only">Edit</span>
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>Editar Producto</DialogTitle>
                                                        <DialogDescription>
                                                            Realiza cambios en los detalles del producto. Haz clic en guardar cuando hayas terminado.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <ProductForm product={product} onFormSubmit={() => { /* no-op */ }} />
                                                </DialogContent>
                                            </Dialog>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="sr-only">Delete</span>
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente el producto.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <form action={deleteProduct.bind(null, product.id)}>
                                                            <AlertDialogAction type="submit">Eliminar</AlertDialogAction>
                                                        </form>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
                {totalProductPages > 1 && (
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Página {currentPage} de {totalProductPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalProductPages}
                        >
                            Siguiente
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function AdminsTab({ admins, onSearch, query }: { admins: Admin[], onSearch: (term: string, type: 'product' | 'admin') => void, query: string }) {
    const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Gestión de Administradores</CardTitle>
                        <CardDescription>Añade y elimina los administradores de la tienda.</CardDescription>
                    </div>
                    <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Añadir Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Añadir Nuevo Admin</DialogTitle>
                                <DialogDescription>
                                    Rellena los detalles del nuevo administrador.
                                </DialogDescription>
                            </DialogHeader>
                            <AdminForm onFormSubmit={() => setIsAdminDialogOpen(false)}/>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        type="search" 
                        placeholder="Buscar admins por nombre o email..." 
                        className="pl-8" 
                        defaultValue={query}
                        onChange={(e) => onSearch(e.target.value, 'admin')}
                    />
                </div>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.id}>
                                    <TableCell className="font-medium">{admin.name}</TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete Admin</span>
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente al administrador <strong>{admin.name}</strong> y revocará su acceso. No puedes eliminar al último administrador.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <form action={deleteAdmin.bind(null, admin.id)}>
                                                        <AlertDialogAction type="submit">Sí, eliminar administrador</AlertDialogAction>
                                                    </form>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

function SettingsTab({ settings, onUpdate }: { settings: StoreSettings | null, onUpdate: () => void }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Configuración de la Tienda</CardTitle>
                <CardDescription>Modifica la información que se muestra en la página principal y el pie de página.</CardDescription>
            </CardHeader>
            <CardContent>
                <StoreSettingsForm settings={settings} onUpdate={onUpdate} />
            </CardContent>
        </Card>
    );
}

function DevelopersTab() {
    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Equipo de Desarrollo</CardTitle>
                    <CardDescription>Conoce a las personas detrás de la magia.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
                    <Card className="flex flex-col items-center p-6 text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src="https://placehold.co/150x150.png" data-ai-hint="person portrait" alt="Developer 1" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-semibold">Juan Developer</h3>
                        <p className="text-muted-foreground">Lead Full-Stack Developer</p>
                        <p className="mt-2 text-sm text-center">Apasionado por crear experiencias de usuario fluidas y eficientes desde el frontend hasta el backend.</p>
                        <div className="flex gap-4 mt-4">
                            <Link href="#" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary"><WhatsappIcon className="h-5 w-5" /></Link>
                            <Link href="#" aria-label="Instagram Profile" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" aria-label="Facebook Profile" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" aria-label="Github Profile" className="text-muted-foreground hover:text-primary"><Github className="h-5 w-5" /></Link>
                        </div>
                    </Card>
                    <Card className="flex flex-col items-center p-6 text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src="https://placehold.co/150x150.png" data-ai-hint="person portrait" alt="Developer 2" />
                            <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-semibold">Ana Interfaz</h3>
                        <p className="text-muted-foreground">UI/UX Designer</p>
                        <p className="mt-2 text-sm text-center">Diseñando interfaces intuitivas y estéticamente agradables que mejoran la interacción del usuario.</p>
                            <div className="flex gap-4 mt-4">
                            <Link href="#" aria-label="WhatsApp" className="text-muted-foreground hover:text-primary"><WhatsappIcon className="h-5 w-5" /></Link>
                            <Link href="#" aria-label="Instagram Profile" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
                            <Link href="#" aria-label="Facebook Profile" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" aria-label="Github Profile" className="text-muted-foreground hover:text-primary"><Github className="h-5 w-5" /></Link>
                        </div>
                    </Card>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Stack Tecnológico</CardTitle>
                    <CardDescription>Las herramientas que hacen posible esta aplicación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold">Framework:</span> Next.js (React)</li>
                        <li><span className="font-semibold">Estilos:</span> Tailwind CSS</li>
                        <li><span className="font-semibold">Componentes UI:</span> ShadCN/UI</li>
                        <li><span className="font-semibold">Backend:</span> Python (Flask) con PostgreSQL</li>
                        <li><span className="font-semibold">Hosting:</span> Render & Vercel</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

function StoresTab() {
    const [stores, setStores] = useState<StoreLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreLocation | null>(null);

    const { toast } = useToast();

    const loadStores = async () => {
        setLoading(true);
        const storesData = await fetchStores();
        setStores(storesData);
        setLoading(false);
    };

    useEffect(() => {
        loadStores();
    }, []);

    const handleOpenDialog = (store: StoreLocation | null = null) => {
        setEditingStore(store);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingStore(null);
    };

    const handleFormSubmit = () => {
        handleCloseDialog();
        loadStores();
        toast({ title: "Éxito", description: `Tienda ${editingStore ? 'actualizada' : 'creada'} correctamente.` });
        revalidatePath('/stores');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Gestión de Tiendas</CardTitle>
                        <CardDescription>Añade, edita y elimina las ubicaciones de tus tiendas.</CardDescription>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Tienda
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead>Dirección</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {stores.map((store) => (
                                    <TableRow key={store.id}>
                                        <TableCell className="font-medium">{store.name}</TableCell>
                                        <TableCell>{store.city}</TableCell>
                                        <TableCell>{store.address}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(store)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            {/* Delete button would go here */}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
                 {isDialogOpen && (
                    <StoreFormDialog
                        isOpen={isDialogOpen}
                        onClose={handleCloseDialog}
                        onSubmitSuccess={handleFormSubmit}
                        store={editingStore}
                    />
                )}
            </CardContent>
        </Card>
    );
}

function StoreFormDialog({ isOpen, onClose, onSubmitSuccess, store }: { isOpen: boolean, onClose: () => void, onSubmitSuccess: () => void, store: StoreLocation | null }) {
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        
        const url = store ? `/api/stores/${store.id}` : '/api/stores';
        const method = store ? 'PUT' : 'POST';

        const response = await fetch(url, { method, body: formData });
        
        if (response.ok) {
            onSubmitSuccess();
        } else {
            toast({ title: "Error", description: "No se pudo guardar la tienda.", variant: "destructive" });
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{store ? 'Editar Tienda' : 'Añadir Nueva Tienda'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4" encType="multipart/form-data">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre</Label>
                        <Input id="name" name="name" defaultValue={store?.name} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" name="address" defaultValue={store?.address} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="city">Ciudad</Label>
                        <Input id="city" name="city" defaultValue={store?.city} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input id="phone" name="phone" defaultValue={store?.phone} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="hours">Horario</Label>
                        <Input id="hours" name="hours" defaultValue={store?.hours} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mapEmbedUrl">URL de Google Maps (Embed)</Label>
                        <Textarea id="mapEmbedUrl" name="mapEmbedUrl" defaultValue={store?.map_embed_url} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="imageFile">Imagen de la Tienda</Label>
                         <Input id="imageFile" name="imageFile" type="file" accept="image/*" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                        <Button type="submit">{store ? 'Guardar Cambios' : 'Añadir Tienda'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
