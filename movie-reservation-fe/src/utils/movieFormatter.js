export const movieFormatter = {
    formatDuration: (minutes) => {
        if (!minutes) return 'N/A';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h${m.toString().padStart(2, '0')}'`;
    },

    formatRating: (rating) => {
        const num = Number(rating);
        if (isNaN(num) || num <= 0) return '(5.0/5.0)';
        return `(${num.toFixed(1)}/5.0)`;
    }
};
