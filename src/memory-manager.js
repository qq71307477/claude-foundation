import { embeddingRegistry } from '@langchain/community/embeddings/google_generative_ai';
import { LanceDB } from 'vectordb';
import fs from 'fs-extra';
import path from 'path';
import { stdin, stdout } from 'process';

// Memory entry types
class MemoryEntry {
  constructor(content, type, createdAt) {
    this.content = content;
    this.type = type;
    this.createdAt = createdAt || new Date().toISOString();
  }
}

// Memory manager class
export class MemoryManager {
  constructor(indexPath = './.claude/memory', vectorPath = './.claude/memory.lancedb') {
    this.indexPath = indexPath;
    this.vectorPath = vectorPath;
    this.entriesPath = path.join(this.indexPath, 'index.json');
  }

  async initialize() {
    await fs.ensureDir(this.indexPath);
    if (!(await fs.pathExists(this.entriesPath))) {
      await fs.writeJson(this.entriesPath, []);
    }
  }

  async addEntry(content, type = 'general') {
    const entries = await this.getEntries();
    const newEntry = new MemoryEntry(content, type);
    entries.push(newEntry);
    await fs.writeJson(this.entriesPath, entries);
    
    // If embedding is configured, add to vector store
    if (this.isEmbeddingConfigured()) {
      await this.addToVectorStore(newEntry);
    }
    
    return newEntry;
  }

  async getEntries() {
    if (!(await fs.pathExists(this.entriesPath))) {
      return [];
    }
    return await fs.readJson(this.entriesPath);
  }

  isEmbeddingConfigured() {
    return process.env.MEMORY_EMBEDDING_PROVIDER && 
           process.env.MEMORY_EMBEDDING_API_KEY &&
           process.env.MEMORY_EMBEDDING_MODEL;
  }

  async addToVectorStore(entry) {
    // Implementation for adding to vector store
    try {
      const db = await LanceDB.connect(this.vectorPath);
      // Vector store logic here
    } catch (error) {
      console.warn('Failed to add to vector store:', error.message);
    }
  }

  async searchEntries(query, limit = 5) {
    if (this.isEmbeddingConfigured()) {
      return await this.searchWithEmbedding(query, limit);
    } else {
      return await this.searchLocal(query, limit);
    }
  }

  async searchWithEmbedding(query, limit) {
    try {
      const db = await LanceDB.connect(this.vectorPath);
      // Embedding search implementation
      return [];
    } catch (error) {
      console.warn('Embedding search failed, falling back to local search:', error.message);
      return await this.searchLocal(query, limit);
    }
  }

  async searchLocal(query, limit) {
    const entries = await this.getEntries();
    // Simple fuzzy matching
    return entries.filter(entry => 
      entry.content.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);
  }
}

export async function runMemoryHook() {
  // Read the entire stdin
  let inputData = '';
  
  // Set stdin to utf8 encoding
  stdin.setEncoding('utf8');
  
  // Read data from stdin
  for await (const chunk of stdin) {
    inputData += chunk;
  }
  
  try {
    // Parse the input as JSON
    const payload = JSON.parse(inputData);
    
    // Check if this looks like a prompt submission that might need memory context
    const promptText = payload.prompt || '';
    
    // Only activate memory hook for prompts that are long enough and might be asking about rules, conventions, etc.
    if (promptText.length > 50) {
      const memoryManager = new MemoryManager();
      await memoryManager.initialize();
      
      // Search for relevant memories
      const relevantMemories = await memoryManager.searchEntries(promptText, 5);
      
      // If we found relevant memories, output them as hook context
      if (relevantMemories.length > 0) {
        const context = {
          memory_hits: relevantMemories.map(m => ({
            content: m.content,
            type: m.type,
            timestamp: m.createdAt
          }))
        };
        
        stdout.write(JSON.stringify(context));
      } else {
        // Output empty context if no matches
        stdout.write('{}');
      }
    } else {
      // Output empty context for short prompts
      stdout.write('{}');
    }
  } catch (error) {
    // If anything goes wrong, output empty context instead of crashing
    stdout.write('{}');
  }
}