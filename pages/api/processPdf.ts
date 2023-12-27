import { createClient } from '@supabase/supabase-js';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { pinecone } from '@/utils/pinecone-client';
import { CustomPDFLoader } from '@/utils/customPDFLoader';
import { supabase } from '@/lib/initSupabase';

export default async function handler(req: any, res: any) {
  try {

    const PINECONE_INDEX_NAME = 'scholar-llama';
    const PINECONE_NAME_SPACE = req.body.bookNamespace;

    const { data, error } = await supabase.storage
      .from('pdfs')
      .download(`public/${PINECONE_NAME_SPACE}.pdf`);

    if (error) {
      console.error('Error downloading PDF from Supabase:', error);
      return res
        .status(500)
        .json({
          success: false,
          error: 'Failed to download PDF from Supabase',
        });
    }

    const loader = new CustomPDFLoader(data);
    const loadedPdf = await loader.load();

    // // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(loadedPdf);
    console.log('split docs', docs);

    res.status(200).json({ success: true, docs });
  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ success: false, error: 'Failed to ingest data' });
  }
}