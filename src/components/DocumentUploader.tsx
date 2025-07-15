import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtractedData {
  type: 'image' | 'pdf';
  filename: string;
  data: any;
}

const DocumentUploader = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const simulateImageExtraction = (filename: string) => {
    // Simulation d'extraction de données d'une police d'assurance
    return {
      numero_police: "ASS-2024-" + Math.random().toString(36).substr(2, 6).toUpperCase(),
      date_debut: "2024-01-15",
      date_fin: "2025-01-14"
    };
  };

  const simulatePdfExtraction = (filename: string) => {
    // Simulation d'extraction de données d'un constat d'accident
    return {
      partie_a: {
        vehicule: {
          marque: "Renault",
          modele: "Clio",
          immatriculation: "AB-123-CD",
          numero_police: "POL-A-789456"
        },
        conducteur: {
          nom: "Dupont",
          prenom: "Jean",
          permis: "123456789",
          date_naissance: "1985-03-12"
        },
        assureur: {
          nom: "Assurance Plus",
          numero_contrat: "CONT-2024-001",
          agence: "Paris Centre"
        }
      },
      partie_b: {
        vehicule: {
          marque: "Peugeot",
          modele: "308",
          immatriculation: "EF-456-GH",
          numero_police: "POL-B-654321"
        },
        conducteur: {
          nom: "Martin",
          prenom: "Marie",
          permis: "987654321",
          date_naissance: "1990-07-25"
        },
        assureur: {
          nom: "Sécurité Auto",
          numero_contrat: "CONT-2024-002",
          agence: "Lyon Sud"
        }
      }
    };
  };

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (file.type === 'application/pdf') {
      const data = simulatePdfExtraction(file.name);
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
      const data = simulateImageExtraction(file.name);
      setExtractedData({
        type: 'image',
        filename: file.name,
        data
      });
      toast({
        title: "Image traitée avec succès",
        description: "Les informations de la police ont été extraites.",
      });
    }
    
    setIsProcessing(false);
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
                    <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary animate-pulse-glow">
                      Extraction des données...
                    </Badge>
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
              <div className="bg-muted/20 rounded-lg border border-border/50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-muted-foreground">Données structurées</span>
                </div>
                <pre className="text-sm overflow-auto whitespace-pre-wrap font-mono text-foreground leading-relaxed">
                  {JSON.stringify(extractedData.data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;