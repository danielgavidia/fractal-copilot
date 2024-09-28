export const convertToDateString = (datetime: string) => {
    // Create a new Date object from the datetime string
    const date = new Date(datetime);

    // Format the date to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}${month}${day}`;
};
