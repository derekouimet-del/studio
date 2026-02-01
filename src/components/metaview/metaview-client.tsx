'use client';

import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import piexif from 'piexifjs';
import Image from 'next/image';
import Link from 'next/link';

// Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Icons
import { UploadCloud, LoaderCircle, Tag, Trash2, Download, MapPin, AlertTriangle, Wand2, Save } from 'lucide-react';

type ExifObject = { [key: string]: { [key: number]: any } };
type FlatExif = { ifd: string; name: string; value: any };

// Helper to convert GPS rational values to decimal degrees
const convertDMSToDD = (dms: [[number, number], [number, number], [number, number]], ref: 'N' | 'S' | 'E' | 'W') => {
  if (!dms || dms.length !== 3) return 0;
  const degrees = dms[0][0] / dms[0][1];
  const minutes = dms[1][0] / dms[1][1];
  const seconds = dms[2][0] / dms[2][1];
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }
  return dd;
};

export function MetaViewClient() {
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [exif, setExif] = useState<ExifObject | null>(null);
  const [editableExif, setEditableExif] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = () => {
    setFile(null);
    setImageDataUrl(null);
    setExif(null);
    setEditableExif({});
    setIsLoading(false);
    setIsProcessing(false);
  };

  const handleFileChange = async (selectedFile: File | null) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/jpeg')) {
      toast({ variant: 'destructive', title: 'Invalid File', description: 'Please upload a JPEG image for EXIF manipulation.' });
      return;
    }

    resetState();
    setIsLoading(true);
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setImageDataUrl(url);
      try {
        const exifObj = piexif.load(url);
        if (Object.keys(exifObj).filter(k => k !== 'thumbnail').length > 0) {
          setExif(exifObj);
          setEditableExif({
            Artist: exifObj['0th']?.[piexif.ImageIFD.Artist] || '',
            ImageDescription: exifObj['0th']?.[piexif.ImageIFD.ImageDescription] || '',
            Make: exifObj['0th']?.[piexif.ImageIFD.Make] || '',
            Model: exifObj['0th']?.[piexif.ImageIFD.Model] || '',
          });
          toast({ title: 'EXIF Data Loaded' });
        } else {
          toast({ title: 'No EXIF Data', description: 'No EXIF tags were found in this image.' });
        }
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error Reading EXIF', description: 'This might not be a valid JPEG file.' });
        resetState();
      }
      setIsLoading(false);
    };
    reader.readAsDataURL(selectedFile);
  };

  const flattenedExif = useMemo<FlatExif[]>(() => {
    if (!exif) return [];
    const data: FlatExif[] = [];
    for (const ifd in exif) {
      if (ifd === 'thumbnail' || ifd === 'Interoperability') continue;
      for (const tag in exif[ifd]) {
        // @ts-ignore
        const tagName = piexif.TAGS[ifd][tag]?.name;
        if (tagName) {
          let value = exif[ifd][tag];
          if (Buffer.isBuffer(value)) {
             value = value.toString('utf-8').replace(/\u0000/g, '').trim();
          }
          if (typeof value === 'string' && value.length > 100) {
            value = value.substring(0, 100) + '...';
          }
          data.push({ ifd, name: tagName, value: String(value) });
        }
      }
    }
    return data;
  }, [exif]);
  
  const gpsData = useMemo(() => {
    if (!exif?.GPS) return null;
    const lat = convertDMSToDD(exif.GPS[piexif.GPSIFD.GPSLatitude], exif.GPS[piexif.GPSIFD.GPSLatitudeRef]);
    const lon = convertDMSToDD(exif.GPS[piexif.GPSIFD.GPSLongitude], exif.GPS[piexif.GPSIFD.GPSLongitudeRef]);
    if(lat === 0 && lon === 0) return null;
    return { lat, lon };
  }, [exif]);

  const handleDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  const handleStripAndDownload = () => {
    if (!imageDataUrl || !file) return;
    setIsProcessing(true);
    const strippedDataUrl = piexif.remove(imageDataUrl);
    handleDownload(strippedDataUrl, `${file.name.replace(/\.[^/.]+$/, "")}_stripped.jpg`);
    toast({ title: 'EXIF Stripped', description: 'New image downloaded.' });
    setIsProcessing(false);
  };
  
  const handleModifyAndDownload = () => {
    if (!imageDataUrl || !file || !exif) return;
    setIsProcessing(true);
    
    const newExif = { ...exif };
    newExif['0th'][piexif.ImageIFD.Artist] = editableExif.Artist;
    newExif['0th'][piexif.ImageIFD.ImageDescription] = editableExif.ImageDescription;
    newExif['0th'][piexif.ImageIFD.Make] = editableExif.Make;
    newExif['0th'][piexif.ImageIFD.Model] = editableExif.Model;
    // Set a software tag to show it was edited with our tool
    newExif['0th'][piexif.ImageIFD.Software] = "Pen-Quest MetaView";

    try {
      const exifBytes = piexif.dump(newExif);
      const newDataUrl = piexif.insert(exifBytes, imageDataUrl);
      handleDownload(newDataUrl, `${file.name.replace(/\.[^/.]+$/, "")}_modified.jpg`);
      toast({ title: 'EXIF Modified', description: 'New image downloaded.' });
    } catch(e) {
      console.error(e);
      toast({variant: 'destructive', title: 'Error writing EXIF', description: 'Some data might be in an invalid format.'});
    }
    
    setIsProcessing(false);
  }

  return (
    <div className="space-y-8">
      {!file && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>Drop a JPEG image to view or edit its EXIF metadata.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFileChange(e.dataTransfer.files?.[0] || null); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
              onClick={() => document.getElementById('file-upload-metaview')?.click()}
              className={cn(
                'relative flex flex-col items-center justify-center p-8 space-y-4 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
                isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              )}
            >
              {isLoading ? (
                <>
                  <LoaderCircle className="size-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading image...</p>
                </>
              ) : (
                <>
                  <UploadCloud className="size-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    Drag & drop your JPEG file here, or click to select one.
                  </p>
                </>
              )}
              <input type="file" id="file-upload-metaview" accept="image/jpeg" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} className="hidden" />
            </div>
          </CardContent>
        </Card>
      )}

      {file && imageDataUrl && (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Image Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Image src={imageDataUrl} alt={file.name} width={500} height={500} className="rounded-md object-contain w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>Download a copy of the image with modified EXIF data.</CardDescription>
                    </CardHeader>
                    <CardFooter className="gap-4">
                        <Button variant="destructive" onClick={handleStripAndDownload} disabled={isProcessing}><Trash2 /> Strip All & Download</Button>
                        <Button onClick={handleModifyAndDownload} disabled={isProcessing}><Save/> Apply Changes & Download</Button>
                         <Button variant="outline" onClick={resetState}>Upload New</Button>
                    </CardFooter>
                </Card>
            </div>
            <Card>
                <Tabs defaultValue="view">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2"><Tag className="text-primary"/> EXIF Metadata</CardTitle>
                                <CardDescription>{file.name}</CardDescription>
                            </div>
                            <TabsList>
                                <TabsTrigger value="view">View</TabsTrigger>
                                <TabsTrigger value="edit">Edit</TabsTrigger>
                            </TabsList>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TabsContent value="view">
                            {gpsData && (
                                <div className="mb-4 p-3 rounded-lg border bg-card flex items-center gap-3">
                                    <MapPin className="size-5 text-primary"/>
                                    <div>
                                        <p className="font-semibold">GPS Coordinates Found</p>
                                        <Link href={`https://www.google.com/maps?q=${gpsData.lat},${gpsData.lon}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                                            {gpsData.lat.toFixed(6)}, {gpsData.lon.toFixed(6)}
                                        </Link>
                                    </div>
                                </div>
                            )}
                            {flattenedExif.length > 0 ? (
                                <ScrollArea className="h-96">
                                <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead>Tag</TableHead>
                                        <TableHead>Value</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {flattenedExif.map((tag, i) => (
                                        <TableRow key={i}>
                                        <TableCell className="font-semibold">{tag.name}</TableCell>
                                        <TableCell className="font-code text-muted-foreground">{tag.value}</TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                                </ScrollArea>
                            ) : (
                                <p className="text-muted-foreground text-center p-8">No readable EXIF data found in this image.</p>
                            )}
                        </TabsContent>
                        <TabsContent value="edit">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Spoof Common Tags</h3>
                                <p className="text-sm text-muted-foreground">Change the values below and click "Apply Changes & Download" to save a new image.</p>
                                <div className="space-y-3 pt-2">
                                     <div>
                                        <Label htmlFor="artist">Artist</Label>
                                        <Input id="artist" value={editableExif.Artist || ''} onChange={e => setEditableExif({...editableExif, Artist: e.target.value})} />
                                     </div>
                                     <div>
                                        <Label htmlFor="description">Description</Label>
                                        <Input id="description" value={editableExif.ImageDescription || ''} onChange={e => setEditableExif({...editableExif, ImageDescription: e.target.value})} />
                                     </div>
                                      <div>
                                        <Label htmlFor="make">Camera Make</Label>
                                        <Input id="make" value={editableExif.Make || ''} onChange={e => setEditableExif({...editableExif, Make: e.target.value})} />
                                     </div>
                                      <div>
                                        <Label htmlFor="model">Camera Model</Label>
                                        <Input id="model" value={editableExif.Model || ''} onChange={e => setEditableExif({...editableExif, Model: e.target.value})} />
                                     </div>
                                </div>
                                <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive-foreground flex items-start gap-3 mt-6">
                                    <AlertTriangle className="size-5 mt-1"/>
                                    <div className="text-sm">
                                        <p className="font-semibold">GPS editing is disabled in this demo.</p>
                                        <p className="opacity-90">Modifying GPS coordinates requires complex conversions that are best handled server-side.</p>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </CardContent>
                </Tabs>
            </Card>
        </div>
      )}
    </div>
  );
}
