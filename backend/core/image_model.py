"""Image Model — Computer vision inference for skin & nutrition analysis."""

import torch
from torchvision import transforms, models
from PIL import Image
from io import BytesIO


class ImageModel:
    """Handles image classification for skin conditions and food recognition."""

    # Class labels (placeholders — replace with your trained model's labels)
    SKIN_LABELS = [
        "Acne", "Eczema", "Melanoma", "Psoriasis", "Healthy", "Unknown",
    ]
    FOOD_LABELS = [
        "Apple", "Banana", "Pizza", "Salad", "Rice", "Unknown",
    ]

    def __init__(self, skin_model_path: str = None, food_model_path: str = None):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ])

        # Load skin model
        self.skin_model = self._load_model(skin_model_path, len(self.SKIN_LABELS))
        # Load food model
        self.food_model = self._load_model(food_model_path, len(self.FOOD_LABELS))

    def _load_model(self, model_path: str, num_classes: int):
        """Load a ResNet model, optionally from saved weights."""
        model = models.resnet50(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
        if model_path:
            model.load_state_dict(torch.load(model_path, map_location=self.device))
        model.to(self.device)
        model.eval()
        return model

    def predict(self, image_bytes: bytes, model_type: str = "skin") -> dict:
        """Run inference on an image."""
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        model = self.skin_model if model_type == "skin" else self.food_model
        labels = self.SKIN_LABELS if model_type == "skin" else self.FOOD_LABELS

        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probs, 1)

        return {
            "label": labels[predicted.item()],
            "confidence": round(confidence.item(), 4),
        }
