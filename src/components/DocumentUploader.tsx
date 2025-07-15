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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Extracteur de Documents d'Assurance
        </h1>
        <p className="text-muted-foreground">
          Uploadez vos polices d'assurance (images) ou constats d'accident (PDF)
        </p>
      </div>

      <Card className="shadow-elegant border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
              ${isDragActive 
                ? 'border-primary bg-primary/5 shadow-glow' 
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <div className="space-y-4">
              <div className="flex justify-center">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              
              <div>
                <p className="text-lg font-medium">
                  {isDragActive 
                    ? "Déposez votre fichier ici..." 
                    : "Glissez-déposez votre document ou cliquez pour sélectionner"
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Formats acceptés: PDF, JPEG, PNG (max 10MB)
                </p>
              </div>

              <div className="flex justify-center gap-2">
                <Badge variant="outline" className="bg-primary/10">
                  <FileText className="h-3 w-3 mr-1" />
                  PDF
                </Badge>
                <Badge variant="outline" className="bg-accent/10">
                  <Image className="h-3 w-3 mr-1" />
                  JPEG/PNG
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {uploadedFile && (
        <Card className="shadow-elegant border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              {isProcessing ? (
                <AlertTriangle className="h-5 w-5 text-accent animate-pulse" />
              ) : (
                <CheckCircle className="h-5 w-5 text-success" />
              )}
              Fichier uploadé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {uploadedFile.type === 'application/pdf' ? (
                  <FileText className="h-8 w-8 text-destructive" />
                ) : (
                  <Image className="h-8 w-8 text-accent" />
                )}
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {isProcessing && (
                  <Badge variant="outline" className="bg-accent/10">
                    Traitement en cours...
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={resetUpload}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {extractedData && (
        <Card className="shadow-elegant border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Données extraites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4">
              <pre className="text-sm overflow-auto whitespace-pre-wrap font-mono">
                {JSON.stringify(extractedData.data, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUploader;