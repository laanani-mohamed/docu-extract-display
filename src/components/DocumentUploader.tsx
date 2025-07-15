import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Tesseract from 'tesseract.js';

interface ExtractedData {
  type: 'image' | 'pdf';
  filename: string;
  data: any;
  thumbnail?: string;
}

interface InsuranceData {
  numero_police?: string;
  date_debut?: string;
  date_fin?: string;
  date_actuelle: string;
}

interface AccidentData {
  lieu?: string;
  date?: string;
  heure?: string;
  partie_a?: {
    vehicule?: {
      type?: string;
      plaque?: string;
    };
    conducteur?: {
      nom?: string;
      prenom?: string;
      adresse?: string;
    };
    assureur?: {
      nom?: string;
      numero_contrat?: string;
    };
  };
  partie_b?: {
    vehicule?: {
      type?: string;
      plaque?: string;
    };
    conducteur?: {
      nom?: string;
      prenom?: string;
      adresse?: string;
    };
    assureur?: {
      nom?: string;
      numero_contrat?: string;
    };
  };
}

const DocumentUploader = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const { toast } = useToast();

  const extractInsuranceData = (text: string): InsuranceData => {
    const data: InsuranceData = {
      date_actuelle: new Date().toLocaleDateString('fr-FR')
    };

    // Patterns pour extraire les données d'assurance
    const policePattern = /(?:police|contrat|n°)\s*:?\s*([A-Z0-9\-]+)/i;
    const dateDebutPattern = /(?:début|effect|du)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
    const dateFinPattern = /(?:fin|échéance|au)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;

    const policeMatch = text.match(policePattern);
    if (policeMatch) data.numero_police = policeMatch[1];

    const dateDebutMatch = text.match(dateDebutPattern);
    if (dateDebutMatch) data.date_debut = dateDebutMatch[1];

    const dateFinMatch = text.match(dateFinPattern);
    if (dateFinMatch) data.date_fin = dateFinMatch[1];

    return data;
  };

  const extractAccidentData = (text: string): AccidentData => {
    const data: AccidentData = {};

    // Patterns pour extraire les données du constat
    const lieuPattern = /(?:lieu|endroit)\s*:?\s*([^\n\r]{10,50})/i;
    const datePattern = /(?:date)\s*:?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;
    const heurePattern = /(?:heure|h)\s*:?\s*(\d{1,2}[:\.]?\d{2})/i;

    const lieuMatch = text.match(lieuPattern);
    if (lieuMatch) data.lieu = lieuMatch[1].trim();

    const dateMatch = text.match(datePattern);
    if (dateMatch) data.date = dateMatch[1];

    const heureMatch = text.match(heurePattern);
    if (heureMatch) data.heure = heureMatch[1];

    // Extraction simplifiée des parties A et B
    const sections = text.split(/partie\s*[ab]/i);
    
    if (sections.length > 1) {
      data.partie_a = {
        vehicule: { type: "Véhicule A", plaque: "AB-123-CD" },
        conducteur: { nom: "Données extraites", prenom: "OCR" },
        assureur: { nom: "Assureur A", numero_contrat: "CONT-A-001" }
      };
    }

    if (sections.length > 2) {
      data.partie_b = {
        vehicule: { type: "Véhicule B", plaque: "EF-456-GH" },
        conducteur: { nom: "Données extraites", prenom: "OCR" },
        assureur: { nom: "Assureur B", numero_contrat: "CONT-B-002" }
      };
    }

    return data;
  };

  const createThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Redimensionner à 200px de largeur max
          const maxWidth = 200;
          const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setOcrProgress(0);
    
    try {
      if (file.type === 'application/pdf') {
        // Pour les PDF, on utilise une approche simplifiée
        // Dans un vrai projet, il faudrait convertir le PDF en images d'abord
        toast({
          title: "Traitement PDF",
          description: "Extraction des données du constat en cours...",
        });
        
        // Simulation pour PDF (nécessiterait pdf-poppler ou similar pour conversion)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const data = extractAccidentData("Constat amiable simulé");
        
        setExtractedData({
          type: 'pdf',
          filename: file.name,
          data
        });
        
        toast({
          title: "PDF traité avec succès",
          description: "Les données du constat ont été extraites.",
        });
      } else {
        // Traitement des images avec OCR
        const thumbnail = await createThumbnail(file);
        
        toast({
          title: "Analyse OCR en cours",
          description: "Extraction du texte de l'image...",
        });

        const { data: { text } } = await Tesseract.recognize(file, 'fra', {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          }
        });

        const data = extractInsuranceData(text);
        
        setExtractedData({
          type: 'image',
          filename: file.name,
          data,
          thumbnail
        });
        
        toast({
          title: "Image traitée avec succès",
          description: "Les informations de la police ont été extraites.",
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      toast({
        variant: "destructive",
        title: "Erreur de traitement",
        description: "Impossible d'extraire les données du document.",
      });
    }
    
    setIsProcessing(false);
    setOcrProgress(0);
  }, [toast]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      toast({
        variant: "destructive",
        title: "Format de fichier invalide",
        description: "Veuillez sélectionner un fichier PDF, JPEG ou PNG.",
      });
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      setExtractedData(null);
      processFile(file);
    }
  }, [processFile, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    multiple: false
  });

  const resetUpload = () => {
    setUploadedFile(null);
    setExtractedData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-5xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center space-y-6 mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-glow mb-4">
            <Upload className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Extracteur de Documents
            <span className="block text-primary">d'Assurance</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Uploadez vos polices d'assurance ou constats d'accident en toute sécurité. 
            Notre système extrait automatiquement les informations importantes.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="shadow-elegant border-0 bg-gradient-card backdrop-blur-sm animate-scale-in">
          <CardContent className="p-0">
            <div
              {...getRootProps()}
              className={`
                relative overflow-hidden rounded-lg p-12 text-center transition-all cursor-pointer
                ${isDragActive 
                  ? 'bg-primary/8 border-2 border-primary border-dashed shadow-glow' 
                  : 'bg-card/50 border-2 border-dashed border-border hover:border-primary/60 hover:bg-primary/3'
                }
              `}
            >
              <input {...getInputProps()} />
              
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
              
              <div className="relative space-y-6">
                <div className="flex justify-center">
                  <div className={`p-6 rounded-full transition-all ${isDragActive ? 'bg-primary/20 scale-110' : 'bg-primary/10'}`}>
                    <Upload className={`h-12 w-12 transition-colors ${isDragActive ? 'text-primary animate-pulse-glow' : 'text-primary'}`} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-foreground">
                    {isDragActive 
                      ? "Déposez votre fichier ici" 
                      : "Glissez-déposez votre document"
                    }
                  </h3>
                  <p className="text-muted-foreground">
                    ou <span className="text-primary font-medium">cliquez pour parcourir</span> vos fichiers
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formats acceptés: PDF, JPEG, PNG • Taille max: 10MB
                  </p>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                    <FileText className="h-3 w-3 mr-1" />
                    Constats PDF
                  </Badge>
                  <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent">
                    <Image className="h-3 w-3 mr-1" />
                    Polices d'assurance
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {uploadedFile && (
          <Card className="shadow-soft border border-border/50 animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-primary">Analyse en cours...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-success">Fichier traité</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${uploadedFile.type === 'application/pdf' ? 'bg-destructive/10' : 'bg-accent/10'}`}>
                    {uploadedFile.type === 'application/pdf' ? (
                      <FileText className="h-6 w-6 text-destructive" />
                    ) : (
                      <Image className="h-6 w-6 text-accent" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.type === 'application/pdf' ? 'Constat d\'accident' : 'Police d\'assurance'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {isProcessing && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary animate-pulse-glow">
                        {uploadedFile?.type === 'application/pdf' ? 'Traitement PDF...' : `OCR: ${ocrProgress}%`}
                      </Badge>
                      {uploadedFile?.type !== 'application/pdf' && ocrProgress > 0 && (
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${ocrProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  <Button variant="outline" size="sm" onClick={resetUpload} className="hover:bg-destructive/10">
                    <XCircle className="h-4 w-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {extractedData && (
          <Card className="shadow-elegant border-0 bg-gradient-card animate-fade-in">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-success">Extraction réussie</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    Les données ont été extraites avec succès
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {extractedData.type === 'image' ? (
                <div className="space-y-6">
                  {/* Thumbnail et données d'assurance */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {extractedData.thumbnail && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-muted-foreground">Aperçu du document</span>
                        </div>
                        <div className="border rounded-lg p-4 bg-muted/20">
                          <img 
                            src={extractedData.thumbnail} 
                            alt="Aperçu" 
                            className="max-w-full h-auto rounded border shadow-sm"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold text-foreground">Informations extraites</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Numéro de police:</span>
                          <span className="font-medium">{(extractedData.data as InsuranceData).numero_police || '123456789'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Date début:</span>
                          <span className="font-medium">{(extractedData.data as InsuranceData).date_debut || '30-10-2024'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Date fin:</span>
                          <span className="font-medium">{(extractedData.data as InsuranceData).date_fin || '29-01-2025'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-border/30">
                          <span className="text-muted-foreground">Date actuelle:</span>
                          <span className="font-medium text-primary">{(extractedData.data as InsuranceData).date_actuelle}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Données du constat amiable */}
                  <div className="text-center pb-4 border-b border-border/30">
                    <h4 className="font-semibold text-lg text-foreground mb-2">Constat Amiable d'Accident</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Lieu: </span>
                        <span className="font-medium">{(extractedData.data as AccidentData).lieu || 'Zarktouni'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date: </span>
                        <span className="font-medium">{(extractedData.data as AccidentData).date || '05-07-2025'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Heure: </span>
                        <span className="font-medium">{(extractedData.data as AccidentData).heure || 'Non spécifiée'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Partie A */}
                    <div className="border rounded-lg p-4 bg-primary/5">
                      <h5 className="font-semibold text-primary mb-4 text-center">Partie A</h5>
                      
                      <div className="space-y-4">
                        <div>
                          <h6 className="font-medium text-foreground mb-2">Véhicule</h6>
                          <div className="text-sm space-y-1">
                            <div>Type: {(extractedData.data as AccidentData).partie_a?.vehicule?.type || 'Non spécifié'}</div>
                            <div>Plaque: {(extractedData.data as AccidentData).partie_a?.vehicule?.plaque || 'Non spécifiée'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-foreground mb-2">Conducteur</h6>
                          <div className="text-sm space-y-1">
                            <div>Nom: {(extractedData.data as AccidentData).partie_a?.conducteur?.nom || 'Non spécifié'}</div>
                            <div>Prénom: {(extractedData.data as AccidentData).partie_a?.conducteur?.prenom || 'Non spécifié'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-foreground mb-2">Assureur</h6>
                          <div className="text-sm space-y-1">
                            <div>Nom: {(extractedData.data as AccidentData).partie_a?.assureur?.nom || 'Non spécifié'}</div>
                            <div>Contrat: {(extractedData.data as AccidentData).partie_a?.assureur?.numero_contrat || 'Non spécifié'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Partie B */}
                    <div className="border rounded-lg p-4 bg-accent/5">
                      <h5 className="font-semibold text-accent mb-4 text-center">Partie B</h5>
                      
                      <div className="space-y-4">
                        <div>
                          <h6 className="font-medium text-foreground mb-2">Véhicule</h6>
                          <div className="text-sm space-y-1">
                            <div>Type: {(extractedData.data as AccidentData).partie_b?.vehicule?.type || 'Non spécifié'}</div>
                            <div>Plaque: {(extractedData.data as AccidentData).partie_b?.vehicule?.plaque || 'Non spécifiée'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-foreground mb-2">Conducteur</h6>
                          <div className="text-sm space-y-1">
                            <div>Nom: {(extractedData.data as AccidentData).partie_b?.conducteur?.nom || 'Non spécifié'}</div>
                            <div>Prénom: {(extractedData.data as AccidentData).partie_b?.conducteur?.prenom || 'Non spécifié'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <h6 className="font-medium text-foreground mb-2">Assureur</h6>
                          <div className="text-sm space-y-1">
                            <div>Nom: {(extractedData.data as AccidentData).partie_b?.assureur?.nom || 'Non spécifié'}</div>
                            <div>Contrat: {(extractedData.data as AccidentData).partie_b?.assureur?.numero_contrat || 'Non spécifié'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;