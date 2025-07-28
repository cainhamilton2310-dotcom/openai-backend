const { db } = require('./server/db.js');
const { classFeatures } = require('./shared/schema.js');

async function populateClassFeatures() {
  try {
    const features = [
      // Fighter features
      { className: 'Fighter', level: 1, featureName: 'Fighting Style', description: 'Choose a specialized combat technique', featureType: 'ability' },
      { className: 'Fighter', level: 1, featureName: 'Second Wind', description: 'Regain hit points as a bonus action', featureType: 'ability' },
      { className: 'Fighter', level: 2, featureName: 'Action Surge', description: 'Take an additional action on your turn', featureType: 'ability' },
      { className: 'Fighter', level: 3, featureName: 'Martial Archetype', description: 'Choose your fighter specialization', featureType: 'ability' },
      { className: 'Fighter', level: 4, featureName: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', featureType: 'improvement' },
      
      // Wizard features
      { className: 'Wizard', level: 1, featureName: 'Spellcasting', description: 'Cast wizard spells using spell slots', featureType: 'spell' },
      { className: 'Wizard', level: 1, featureName: 'Arcane Recovery', description: 'Recover expended spell slots during a short rest', featureType: 'ability' },
      { className: 'Wizard', level: 2, featureName: 'Arcane Tradition', description: 'Choose your magical specialization', featureType: 'ability' },
      { className: 'Wizard', level: 4, featureName: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', featureType: 'improvement' },
      
      // Rogue features
      { className: 'Rogue', level: 1, featureName: 'Expertise', description: 'Double proficiency bonus for chosen skills', featureType: 'proficiency' },
      { className: 'Rogue', level: 1, featureName: 'Sneak Attack', description: 'Deal extra damage when conditions are met', featureType: 'ability' },
      { className: 'Rogue', level: 1, featureName: 'Thieves\' Cant', description: 'Secret language known by rogues', featureType: 'proficiency' },
      { className: 'Rogue', level: 2, featureName: 'Cunning Action', description: 'Dash, Disengage, or Hide as bonus action', featureType: 'ability' },
      { className: 'Rogue', level: 3, featureName: 'Roguish Archetype', description: 'Choose your rogue specialization', featureType: 'ability' },
      
      // Cleric features
      { className: 'Cleric', level: 1, featureName: 'Spellcasting', description: 'Cast cleric spells using spell slots', featureType: 'spell' },
      { className: 'Cleric', level: 1, featureName: 'Divine Domain', description: 'Choose your divine specialization', featureType: 'ability' },
      { className: 'Cleric', level: 2, featureName: 'Channel Divinity', description: 'Harness divine energy for special effects', featureType: 'ability' },
      { className: 'Cleric', level: 4, featureName: 'Ability Score Improvement', description: 'Increase ability scores or take a feat', featureType: 'improvement' },
    ];
    
    for (const feature of features) {
      await db.insert(classFeatures).values(feature).onConflictDoNothing();
    }
    
    console.log('Class features populated successfully!');
  } catch (error) {
    console.error('Error populating class features:', error);
  }
  
  process.exit(0);
}

populateClassFeatures();
