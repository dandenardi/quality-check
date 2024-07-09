import { useRef, useState, useEffect } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Button, Input, Spacer, Card } from '@nextui-org/react';
import { CiBoxes, CiBarcode, CiDeliveryTruck } from "react-icons/ci";

const FRAME_RATE = 30;

interface Annotation {
    concept: string;
    startTime: number;
    endTime: number | null;
}

function VideoUploader() {

    //video states
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoFile, setVideoFile] = useState<string | null>(null);

    //quality verification states
    const [annotations, setAnnotations] = useState<Annotation[]>([]);
    const [activeAnnotations, setActiveAnnotations] = useState<{ [concept: string]: number }>({});

    //camera states
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

    useEffect(() => {
        if (videoRef.current) {
            console.log('Elemento de vídeo montado:', videoRef.current);
        } else {
            console.error('Elemento de vídeo ainda não está disponível.');
        }
    }, [videoRef]);

    function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoFile(url);

        }

    };


    function handleSave() {
        const jsonBlob = new Blob([JSON.stringify(annotations, null, 2)], { type: 'application/json' });
        saveAs(jsonBlob, 'annotations.json');

        const ws = XLSX.utils.json_to_sheet(annotations);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Annotations');
        XLSX.writeFile(wb, 'annotations.xlsx');

        const doc = new jsPDF();
        doc.text('Anotações', 20, 10);
        annotations.forEach((annotation, index) => {
            doc.text(
                `Conceito: ${annotation.concept}, Início: ${annotation.startTime}, Fim: ${annotation.endTime}`,
                20,
                10 + (index * 10),

            );
        });
        doc.save('annotations.pdf');
    };

    async function startCamera() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                console.log("Solicitando acesso à câmera...");
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                console.log("Acesso concedido. Stream recebido:", stream);

                setTimeout(() => {
                    if (videoRef.current) {
                        console.log("Elemento de vídeo encontrado:", videoRef.current)
                        videoRef.current.srcObject = stream;
                        videoRef.current.play();
                        setIsCameraActive(true);
                        console.log("Camera iniciada e stream atribuído ao elemento de vídeo.")
                        setVideoFile(null);
                    } else {
                        console.error("Elemento de vídeo não encontrado.")
                    }
                }, 100);

            } catch (error) {
                console.error("Error accessing the camera: ", error);
            }
        } else {
            console.error('API getUserMedia não suportada pelo navegador.');
        }
    };

    function stopCamera() {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraActive(false);
            console.log("Câmera parada e stream removido do elemento de vídeo.");
        } else {
            console.error("Stream de vídeo não encontrado.");
        }
    }

    function toggleAnnotation(concept: string) {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;

            if (activeAnnotations[concept] !== undefined) {
                setAnnotations(prevAnnotations =>
                    prevAnnotations.map(annotation =>
                        annotation.concept === concept && annotation.endTime === null ? { ...annotation, endTime: currentTime } : annotation
                    )
                );
                setActiveAnnotations(prevActiveAnnotations => {
                    const { [concept]: _, ...rest } = prevActiveAnnotations;
                    return rest;
                });

            } else {
                setAnnotations(prevAnnotations => [
                    ...prevAnnotations,
                    { concept, startTime: currentTime, endTime: null },
                ]);
                setActiveAnnotations(prevActiveAnnotations => ({
                    ...prevActiveAnnotations,
                    [concept]: currentTime
                }));
            }
        }
    };

    return (
        <div>
            <label htmlFor="video-upload">
                <Button as="span">Selecionar Video</Button>
            </label>
            <input
                id="video-upload"
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                style={{ display: 'none' }}
            />
            <Button onClick={startCamera} disabled={isCameraActive}>Iniciar Câmera</Button>
            <Button onClick={stopCamera} disabled={!isCameraActive}>Parar Câmera</Button>
            <video ref={videoRef} src={isCameraActive ? undefined : (videoFile ?? undefined)} controls width="600"></video>
            <div>
                <Button
                    onClick={() => toggleAnnotation('carregando')}
                    style={{ backgroundColor: activeAnnotations['carregando'] !== undefined ? 'green' : 'gray' }}
                >
                    <CiDeliveryTruck /> Carregando
                </Button>
                <Button
                    onClick={() => toggleAnnotation('processando')}
                    style={{ backgroundColor: activeAnnotations['processando'] !== undefined ? 'green' : 'gray' }}
                >
                    <CiBarcode /> Processando
                </Button>
                <Button
                    onClick={() => toggleAnnotation('descarregando')}
                    style={{ backgroundColor: activeAnnotations['descarregando'] !== undefined ? 'green' : 'gray' }}
                >
                    <CiBoxes /> Descarregando
                </Button>
                <div>
                    <Button onClick={handleSave}>Salvar Anotações</Button>
                </div>
            </div>
        </div>
    );
};


export default VideoUploader;