
// filter.js

/**
 * Calculates the skill match percentage based on how many of an internship's
 * required skills the user possesses.
 * @param {object} internship - The internship object.
 * @param {string} userSkillsStr - A comma-separated string of user skills.
 * @returns {number} The match percentage (0-100).
 */
function calculateSkillMatch(internship, userSkillsStr) {
    const userSkills = new Set(userSkillsStr.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
    const internshipSkills = new Set((internship.skills || []).map(s => s.toLowerCase()));

    if (internshipSkills.size === 0) {
        // If the internship lists no required skills, we can consider it a partial match by default.
        return 50;
    }

    if (userSkills.size === 0) {
        return 0;
    }

    const matchedSkills = [...userSkills].filter(skill => internshipSkills.has(skill));
    
    // Calculate match based on the internship's required skills.
    return Math.round((matchedSkills.length / internshipSkills.size) * 100);
}


/**
 * Filters an internship based on its type (commitment, paid/unpaid).
 * @param {object} internship - The internship object.
 * @param {string} userDuration - The user's selected internship type.
 * @returns {boolean} True if the internship matches, false otherwise.
 */
function filterByDuration(internship, userDuration) {
    const type = userDuration.toLowerCase();
    const commitment = (internship.commitment || '').toLowerCase();

    if (type === 'paid') return internship.isPaid === true;
    if (type === 'unpaid') return !internship.isPaid;
    if (type === 'full-time') return commitment === 'full-time';
    if (type === 'part-time') return commitment === 'part-time';

    return true; // If 'all' or another value, don't filter it out.
}

/**
 * Filters and sorts internships based on a blended score of skill and location match.
 * @param {Array<object>} allInternships - The complete list of available internships.
 * @param {object} userData - The user's survey and profile data.
 * @returns {{internships: Array<object>}|{message: string}} - An object with either the filtered internships or a message.
 */
export function getFilteredInternships(allInternships, userData) {
    const userSkills = (userData.skills || '').trim();
    const userLocation = (userData.location || '').trim();
    const userDuration = (userData.internshipType || '').trim();

    const hasSkills = userSkills !== '';
    const hasLocation = userLocation !== '';
    const hasDuration = userDuration !== '' && userDuration.toLowerCase() !== 'all';

    // --- Message Handling ---
    if (!hasSkills && !hasLocation) {
        return { message: "Please enter your skills and location for the best recommendations." };
    }

    const finalResults = [];

    for (const internship of allInternships) {
        // First, check the hard filter for duration.
        if (hasDuration && !filterByDuration(internship, userDuration)) {
            continue; // Skip this internship if it doesn't match the duration filter.
        }

        const skillScore = hasSkills ? calculateSkillMatch(internship, userSkills) : 0;
        const isLocationMatch = hasLocation ? (internship.location || '').toLowerCase().includes(userLocation.toLowerCase()) : false;
        
        let finalScore = 0;
        let shouldInclude = false;

        if (hasSkills && hasLocation) {
            if (skillScore > 0 && isLocationMatch) {
                finalScore = skillScore;
                shouldInclude = true;
            } else if (skillScore === 0 && isLocationMatch) {
                // SPECIAL CASE: No skill match, but location matches.
                finalScore = 15; 
                shouldInclude = true;
            }
        } else if (hasSkills) {
            if (skillScore > 0) {
                finalScore = skillScore;
                shouldInclude = true;
            }
        } else if (hasLocation) {
            if (isLocationMatch) {
                // No skills entered, just location. Give a neutral score.
                finalScore = 50; 
                shouldInclude = true;
            }
        }

        if (shouldInclude) {
            finalResults.push({
                ...internship,
                skillMatchPercentage: finalScore,
            });
        }
    }

    // --- Sorting ---
    finalResults.sort((a, b) => b.skillMatchPercentage - a.skillMatchPercentage);

    if (finalResults.length === 0) {
        return { message: "No internships match your current filters. Try removing some filters." };
    }

    return { internships: finalResults };
}
