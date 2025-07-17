'use client';
/**
 * @fileoverview Página del panel de control de administración.
 * Muestra una tabla con los productos existentes y otra con los administradores.
 * Permite realizar acciones como agregar, editar o eliminar productos, y añadir nuevos admins.
 * Implementa modales para la gestión de productos y diálogos de confirmación.
 * Incluye un generador de facturas y un panel para enviar notificaciones.
 */
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchProducts, fetchAdmins, fetchStoreSettings } from "@/lib/data";
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
import { PlusCircle, Edit, Trash2, Search, FileText, BellRing, Settings, XCircle, Github, Instagram, Facebook } from "lucide-react";
import Image from "next/image";
import Link from 'next/link';
import { Product, Admin, StoreSettings } from "@/lib/definitions";
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
import { formatCurrency } from '@/lib/utils';

const getSafeImageUrl = (urlInput: unknown): string => {
    const placeholder = 'https://placehold.co/64x64.png';
    if (typeof urlInput !== 'string' || !urlInput.trim()) {
        return placeholder;
    }

    if (urlInput.startsWith('/') || urlInput.startsWith('data:')) {
        return urlInput;
    }

    try {
        new URL(urlInput);
        return urlInput;
    } catch (e) {
        return placeholder;
    }
};

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
                         <Tabs defaultValue={product?.images?.[i-1] ? 'url' : 'upload'} className="w-full">
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
                <Checkbox id="isFeatured" name="isFeatured" defaultChecked={product?.isFeatured} className="col-span-3 justify-self-start" />
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

// Form component for store settings
function StoreSettingsForm({ settings }: { settings: StoreSettings | null }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        
        const formData = new FormData(event.currentTarget);
        const result = await updateStoreSettings(formData);

        if (result.success) {
            toast({
                title: "Éxito",
                description: "La configuración de la tienda se ha guardado correctamente.",
            });
            router.refresh();
        } else {
            toast({
                title: "Error",
                description: result.error || "No se pudo guardar la configuración.",
                variant: "destructive",
            });
        }
        
        setIsSubmitting(false);
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
            <Card>
                <CardHeader>
                    <CardTitle>Sección de Bienvenida (Héroe)</CardTitle>
                    <CardDescription>Personaliza la sección principal de tu página de inicio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="heroHeadline">Título Principal</Label>
                        <Input id="heroHeadline" name="heroHeadline" defaultValue={settings?.heroHeadline} placeholder="Elegancia Atemporal, Redefinida." required />
                        <p className="text-sm text-muted-foreground">El encabezado grande y llamativo.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="heroSubheadline">Subtítulo</Label>
                        <Textarea id="heroSubheadline" name="heroSubheadline" defaultValue={settings?.heroSubheadline} placeholder="Descubre nuestra colección exclusiva..." required />
                        <p className="text-sm text-muted-foreground">El texto que acompaña al título principal.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="heroButtonText">Texto del Botón</Label>
                        <Input id="heroButtonText" name="heroButtonText" defaultValue={settings?.heroButtonText} placeholder="Explorar Colección" required />
                        <p className="text-sm text-muted-foreground">El texto dentro del botón de llamada a la acción.</p>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mainImageUrl">Imagen de Fondo del Héroe</Label>
                        <Tabs defaultValue={settings?.mainImageUrl ? 'url' : 'upload'} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="url">URL</TabsTrigger>
                                <TabsTrigger value="upload">Subir Archivo</TabsTrigger>
                            </TabsList>
                            <TabsContent value="url">
                                <Input name="mainImageUrl" placeholder="URL de la imagen" defaultValue={settings?.mainImageUrl} />
                            </TabsContent>
                            <TabsContent value="upload">
                                <Input name="mainImageFile" type="file" accept="image/*" />
                            </TabsContent>
                        </Tabs>
                        <p className="text-sm text-muted-foreground">La imagen de fondo para la sección de bienvenida.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sección de Colección Destacada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="featuredCollectionTitle">Título de la Sección</Label>
                        <Input id="featuredCollectionTitle" name="featuredCollectionTitle" defaultValue={settings?.featuredCollectionTitle} placeholder="COLECCIÓN ROYAL SERIES" required />
                         <p className="text-sm text-muted-foreground">El título sobre la cuadrícula de productos destacados.</p>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="featuredCollectionDescription">Descripción de la Colección</Label>
                        <Textarea id="featuredCollectionDescription" name="featuredCollectionDescription" defaultValue={settings?.featuredCollectionDescription} placeholder="La Royal Series ofrece una gama de relojes..." />
                         <p className="text-sm text-muted-foreground">Un texto descriptivo para la colección destacada.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Sección Promocional con Video</CardTitle>
                    <CardDescription>Configura la sección con un video de YouTube y texto descriptivo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="promoSectionTitle">Título de la Sección Promo</Label>
                        <Input id="promoSectionTitle" name="promoSectionTitle" defaultValue={settings?.promoSectionTitle} placeholder="ROYAL DELUXE" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="promoSectionDescription">Descripción de la Sección Promo</Label>
                        <Textarea id="promoSectionDescription" name="promoSectionDescription" defaultValue={settings?.promoSectionDescription} placeholder="Descubre la elegancia y la innovación..." />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="promoSectionVideoUrl">URL del Video de YouTube (Embed)</Label>
                        <Input id="promoSectionVideoUrl" name="promoSectionVideoUrl" defaultValue={settings?.promoSectionVideoUrl} placeholder="https://www.youtube.com/embed/VIDEO_ID" />
                        <p className="text-sm text-muted-foreground">Importante: Usa la URL para "Embed" (Insertar), no la URL normal del video.</p>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <CardTitle>Sección de Ubicación</CardTitle>
                    <CardDescription>Actualiza los detalles de tu tienda física que se muestran en la página de inicio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="locationSectionTitle">Título de la Sección</Label>
                        <Input id="locationSectionTitle" name="locationSectionTitle" defaultValue={settings?.locationSectionTitle} placeholder="Visita Nuestra Tienda Insignia" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" name="address" defaultValue={settings?.address} required />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="hours">Horario de Apertura</Label>
                        <Input id="hours" name="hours" defaultValue={settings?.hours} required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="mapEmbedUrl">URL de Google Maps (Embed)</Label>
                        <Textarea 
                            id="mapEmbedUrl" 
                            name="mapEmbedUrl" 
                            defaultValue={settings?.mapEmbedUrl} 
                            placeholder="Pega aquí la URL 'src' del iframe de Google Maps" 
                            rows={3}
                        />
                        <p className="text-sm text-muted-foreground">
                            Ve a Google Maps, busca un lugar, haz clic en "Compartir", luego en "Insertar un mapa" y copia solo la URL que está dentro del atributo <strong>src="..."</strong>.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Información de Contacto y Redes Sociales</CardTitle>
                    <CardDescription>Configura los datos de contacto y enlaces que aparecen en el pie de página.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono de Contacto</Label>
                        <Input id="phone" name="phone" defaultValue={settings?.phone} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="contactEmail">Email de Contacto</Label>
                        <Input id="contactEmail" name="contactEmail" type="email" defaultValue={settings?.contactEmail} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="twitterUrl">URL de Twitter (X)</Label>
                        <Input id="twitterUrl" name="twitterUrl" defaultValue={settings?.twitterUrl} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="instagramUrl">URL de Instagram</Label>
                        <Input id="instagramUrl" name="instagramUrl" defaultValue={settings?.instagramUrl} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="facebookUrl">URL de Facebook</Label>
                        <Input id="facebookUrl" name="facebookUrl" defaultValue={settings?.facebookUrl} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
            </div>
        </form>
    );
}

// Main page component
export default function AdminDashboardPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    const [productCurrentPage, setProductCurrentPage] = useState(1);
    
    // State for multi-product invoice
    const [invoiceItems, setInvoiceItems] = useState<{ product: Product; quantity: number }[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [selectedInvoiceProduct, setSelectedInvoiceProduct] = useState<string>('');
    const [selectedInvoiceQuantity, setSelectedInvoiceQuantity] = useState<number>(1);
    
    const notificationFormRef = React.useRef<HTMLFormElement>(null);

    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productQuery = searchParams.get('q') || '';
    const adminQuery = searchParams.get('admin_q') || '';
    
    useEffect(() => {
        async function loadData() {
            setLoading(true);
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
                console.error("Failed to load dashboard data:", error);
                toast({
                    title: "Error de Carga",
                    description: "No se pudieron cargar los datos del panel. Asegúrate de que el backend esté funcionando.",
                    variant: 'destructive'
                });
            } finally {
                setLoading(false);
                setProductCurrentPage(1);
            }
        }
        loadData();
    }, [productQuery, adminQuery, toast]);
    
    const handleSearch = (term: string, type: 'product' | 'admin') => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set(type === 'product' ? 'q' : 'admin_q', term);
        } else {
            params.delete(type === 'product' ? 'q' : 'admin_q');
        }
        router.replace(`/admin/dashboard?${params.toString()}`);
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
            fetchProducts(productQuery).then(setProducts);

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

    const productsPerPage = 10;
    const indexOfLastProduct = productCurrentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalProductPages = Math.ceil(products.length / productsPerPage);

    if (loading) {
        return <div className="container mx-auto py-12 px-4 space-y-12"><Skeleton className="h-96 w-full" /></div>
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold font-headline mb-8">Panel de Administración</h1>

            <Tabs defaultValue="products" className="w-full">
                <TabsList className="grid w-full grid-cols-1 h-auto md:h-10 md:grid-cols-5 mb-6">
                    <TabsTrigger value="overview">Resumen</TabsTrigger>
                    <TabsTrigger value="products">Productos</TabsTrigger>
                    <TabsTrigger value="admins">Administradores</TabsTrigger>
                    <TabsTrigger value="settings">Configuración</TabsTrigger>
                    <TabsTrigger value="developers">Desarrolladores</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Enviar Notificación Personalizada</CardTitle>
                                <BellRing className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <form ref={notificationFormRef} onSubmit={handleNotificationSubmit} className="flex flex-col gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="message">Mensaje</Label>
                                        <Textarea id="message" name="message" placeholder="¡Anuncia una nueva oferta!" required />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="imageUrl">URL de la Imagen (Opcional)</Label>
                                        <Input id="imageUrl" name="imageUrl" placeholder="https://example.com/image.png" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="linkUrl">URL del Enlace (Opcional)</Label>
                                        <Input id="linkUrl" name="linkUrl" placeholder="https://your-store.com/sale" />
                                    </div>
                                    <Button type="submit" disabled={isSendingNotification} className="w-full">
                                        {isSendingNotification ? 'Enviando...' : 'Enviar Notificación'}
                                    </Button>
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
                </TabsContent>

                <TabsContent value="products">
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
                                    defaultValue={productQuery}
                                    onChange={(e) => handleSearch(e.target.value, 'product')}
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
                                                    <TableCell>{product.isFeatured ? 'Sí' : 'No'}</TableCell>
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
                                        onClick={() => setProductCurrentPage(productCurrentPage - 1)}
                                        disabled={productCurrentPage === 1}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        Página {productCurrentPage} de {totalProductPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setProductCurrentPage(productCurrentPage + 1)}
                                        disabled={productCurrentPage === totalProductPages}
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins">
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
                                    defaultValue={adminQuery}
                                    onChange={(e) => handleSearch(e.target.value, 'admin')}
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
                </TabsContent>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> Configuración de la Tienda</CardTitle>
                            <CardDescription>Modifica la información que se muestra en la página principal y el pie de página.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StoreSettingsForm settings={storeSettings} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="developers">
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
                                    <li><span className="font-semibold">Inteligencia Artificial:</span> Google Genkit</li>
                                    <li><span className="font-semibold">Backend:</span> Python (Flask)</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
