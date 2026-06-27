package vn.project.jobhunter.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileService {

    @Value("${myProject.upload-file.base-uri}")
    private String baseURI;

    public void createDirectory(String folder) throws URISyntaxException {
        URI uri = new URI(folder);
        Path path = Paths.get(uri).normalize();
        if (!Files.isDirectory(path)) {
            try {
                Files.createDirectories(path);
                System.out.println(">>> CREATE NEW DIRECTORY SUCCESSFUL, PATH = " + path);
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {
            System.out.println(">>> SKIP MAKING DIRECTORY, ALREADY EXISTS");
        }

    }

    public String store(MultipartFile file, String folder) throws URISyntaxException, IOException {
        // create unique filename
        String finalName = System.currentTimeMillis() + "-" + sanitizeUploadedFileName(file.getOriginalFilename());

        Path path = resolveUploadPath(folder, finalName);
        Files.createDirectories(path.getParent());
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, path,
                    StandardCopyOption.REPLACE_EXISTING);
        }
        return finalName;
    }

    public long getFileLength(String fileName, String folder) throws URISyntaxException {
        Path path = resolveUploadPath(folder, fileNameOnly(fileName));

        File tmpDir = new File(path.toString());

        // Nếu không tồn tại, hoặc là thư mục => return -1 để controller báo lỗi rõ ràng
        if (!tmpDir.exists() || tmpDir.isDirectory()) {
            return -1;
        }

        return tmpDir.length();
    }

    public InputStreamResource getResource(String fileName, String folder)
            throws URISyntaxException, FileNotFoundException {
        Path path = resolveUploadPath(folder, fileNameOnly(fileName));
        File file = new File(path.toString());
        if (!file.exists() || file.isDirectory()) {
            throw new FileNotFoundException("File not found or is a directory: " + fileName);
        }
        return new InputStreamResource(new FileInputStream(file));
    }

    private Path resolveUploadPath(String folder, String fileName) throws URISyntaxException {
        Path basePath = Paths.get(new URI(baseURI)).normalize();
        Path folderPath = basePath.resolve(cleanRelativePath(folder)).normalize();
        Path filePath = folderPath.resolve(fileNameOnly(fileName)).normalize();

        if (!folderPath.startsWith(basePath) || !filePath.startsWith(folderPath)) {
            throw new IllegalArgumentException("Invalid upload path");
        }

        return filePath;
    }

    private String cleanRelativePath(String folder) {
        if (folder == null || folder.isBlank()) {
            return "";
        }
        return folder.replace("\\", "/").replaceAll("^/+", "").replaceAll("/+$", "");
    }

    private String fileNameOnly(String fileName) {
        String safeName = fileName;
        if (safeName == null || safeName.isBlank()) {
            safeName = "file";
        }

        safeName = safeName.replace("\\", "/");
        int slashIndex = safeName.lastIndexOf("/");
        if (slashIndex >= 0) {
            safeName = safeName.substring(slashIndex + 1);
        }

        return safeName.isBlank() ? "file" : safeName;
    }

    private String sanitizeUploadedFileName(String originalFileName) {
        return fileNameOnly(originalFileName).replaceAll("[^a-zA-Z0-9._-]", "_");
    }

}
