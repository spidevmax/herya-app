const fs = require('fs').promises;
const path = require('path');
const Papa = require('papaparse');
const Pose = require('../models/Pose');

async function seedPoses() {
  try {
    const csvPath = path.join(__dirname, 'data', 'poses.csv');
    const csvData = await fs.readFile(csvPath, 'utf-8');
    
    const { data } = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim()
    });
    
    // Transformar datos CSV al formato del modelo
    const poses = data.map(row => ({
      name: row.name.trim(),
      sanskritName: row.sanskritName?.trim(),
      category: row.category,
      difficulty: parseInt(row.difficulty),
      defaultDuration: parseInt(row.defaultDuration),
      benefits: row.benefits?.split(',').map(b => b.trim()),
      instructions: row.instructions?.split('|').map(i => i.trim()),
      contraindications: row.contraindications?.split(',').map(c => c.trim()),
      imageUrl: row.imageUrl,
      tags: row.tags?.split(',').map(t => t.trim())
    }));
    
    await Pose.insertMany(poses);
    console.log(`✅ Seeded ${poses.length} poses`);
  } catch (error) {
    console.error('❌ Error seeding poses:', error);
    throw error;
  }
}

module.exports = seedPoses;
