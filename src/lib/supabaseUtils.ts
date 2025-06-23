import { supabase } from "@/supabaseClient";

const BUCKET_NAMES = [
  "avatars",
  "category-images",
  "empty-state-images",
  "income-images",
  "reimbursement-images",
  "settlement-images",
];

export const createStorageBuckets = async () => {
  try {
    const { data: buckets, error: listError } =
      await supabase.storage.listBuckets();

    if (listError) {
      console.error("Error listing buckets:", listError.message);
      return;
    }

    const existingBucketNames = buckets.map((bucket) => bucket.name);

    for (const bucketName of BUCKET_NAMES) {
      if (!existingBucketNames.includes(bucketName)) {
        const { error: createError } = await supabase.storage.createBucket(
          bucketName,
          {
            public: true,
            allowedMimeTypes: [
              "image/png",
              "image/jpeg",
              "image/jpg",
              "image/gif",
              "image/svg+xml",
            ],
            fileSizeLimit: 1024 * 1024 * 5, // 5MB
          }
        );
        if (createError) {
          console.error(
            `Error creating bucket "${bucketName}":`,
            createError.message
          );
        } else {
          console.log(`Bucket "${bucketName}" created successfully.`);
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("An unexpected error occurred:", error.message);
    } else {
      console.error("An unexpected error occurred:", error);
    }
  }
};
