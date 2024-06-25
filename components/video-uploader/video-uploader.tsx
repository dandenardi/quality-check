import { useRef, useState } from 'react';
import { saveAs } from 'file-saver';
import XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { FaThumbsUp, FaRegMeh, FaThumbsDown } from 'react-icons/fa';

const FRAME_RATE = 30;

interface Annotation {
    time: number;
    frame: number;
    concept: string;
}

function VideoUploader() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoFile, setVideoFile] = useState<string | null>(null);
    const [annotations, setAnnotations] = useState<Annotation[]>([]);

    function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(URL.createObjectURL(file));
        }

    };

    function handleAnnotation(concept: string) {
        if (videoRef.current) {
            const currentTime = videoRef.current.currentTime;
            const frame = Math.floor(currentTime * FRAME_RATE);
            setAnnotations((prevAnnotations) => [
                ...prevAnnotations,
                { time: currentTime, frame, concept }
            ]);

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
        annotations.forEach((annotation, index) => {
            doc.text(
                20,
                10 + (index * 10),
                `Time: ${annotation.time.toFixed(2)}s, Frame: ${annotation.frame}, Concept: ${annotation.concept}`
            );
        });
        doc.save('annotations.pdf');
    };

    return (
        <div>
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
            {videoFile && (
                <div>
                    <video ref={videoRef} src={videoFile} controls width="600"></video>
                    <div>
                        <button onClick={() => handleAnnotation('good')}>
                            <FaThumbsUp /> Peça Boa
                        </button>
                        <button onClick={() => handleAnnotation('average')}>
                            <FaRegMeh /> Peça Média
                        </button>
                        <button onClick={() => handleAnnotation('bad')}>
                            <FaThumbsDown /> Peça Ruim
                        </button>
                        <div>
                            <button onClick={handleSave}>Salvar Anotações</button>
                        </div>
                    </div>


                </div>
            )}
        </div>
    );
};

export default VideoUploader;